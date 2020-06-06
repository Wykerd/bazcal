import fetch from 'node-fetch'
import APICache from '../models/cache'
import fs from 'fs'
import path from 'path'

/**
 * Jobs
 * @param {import('agenda')} agenda 
 */
export function CachingJobs (agenda) {
    agenda.define('cache:api_res', async job => {
        console.log('Running cache job...');
        try {
            const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${process.env.API_KEY}`);
            const json = await api_res.json();

            const cache = new APICache({
                response: json,
                timestamp: new Date()
            });

            const doc = await cache.save();

            const regen = {};

            for (const product in (doc.response?.products ?? {})) {
                const prod = doc.response?.products[product];
                if (!prod) continue;
                regen[product] = {};
                regen[product].buy = prod.sell_summary?.[0]?.pricePerUnit ?? 0;
                regen[product].sell = prod.buy_summary?.[0]?.pricePerUnit ?? 0;
                regen[product].volume = prod.quick_status?.buyMovingWeek ?? 0;
                regen[product].svolume = prod.quick_status?.sellMovingWeek ?? 0;
                regen[product].count = 1;
            }

            await agenda.now('cache:regenerate_stats', regen);

            await agenda.schedule('in a week', 'cache:purge', { cache_id: doc._id });
        } catch (err) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });

    agenda.define('cache:purge', async job => {
        try {
            console.log('Purging old cached response...');
            const doc = await APICache.findByIdAndDelete(job.attrs.data._id);

            const regen = {};

            for (const product in (doc.response?.products ?? {})) {
                const prod = doc.response?.products[product];
                if (!prod) continue;
                regen[product] = {};
                regen[product].buy = -prod.sell_summary?.[0]?.pricePerUnit ?? 0;
                regen[product].sell = -prod.buy_summary?.[0]?.pricePerUnit ?? 0;
                regen[product].volume = -prod.quick_status?.buyMovingWeek ?? 0;
                regen[product].svolume = -prod.quick_status?.sellMovingWeek ?? 0;
                regen[product].count = -1;
            }

            await agenda.now('cache:regenerate_stats', regen);

            await job.remove();
        } catch (error) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });

    agenda.define('cache:regenerate_stats', { concurrency: 1 }, async job => {
        try {
            console.log('Regenerating stats...');
            const f_path = path.resolve(process.env.DATA_DIR ?? './', 'stats.json');
            let file_contents;
            try {
                file_contents = await fs.promises.readFile(f_path, 'utf-8');  
            } catch (error) {
                file_contents = "{}";
            } 
            const stats = JSON.parse(file_contents);
            Object.keys(job.attrs.data).forEach(key => {
                const patch = job.attrs.data[key];
                if (patch) {
                    if (!stats[key]) stats[key] = {
                        buy: [0,0],
                        sell: [0,0],
                        volume: 0,
                        svolume: 0,
                        count: 0
                    };

                    stats[key].buy[0] += patch.buy;
                    stats[key].sell[0] += patch.sell;
                    stats[key].volume += patch.volume;
                    stats[key].svolume += patch.svolume;
                    stats[key].buy[1] += (patch.buy * patch.buy) / 100;
                    stats[key].sell[1] += (patch.sell * patch.sell) / 100;
                    stats[key].count += patch.count;
                }
            });
            await fs.promises.writeFile(f_path, JSON.stringify(stats));
        } catch (error) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });
}