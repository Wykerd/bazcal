import fetch from 'node-fetch'
import { ema } from '../utils'

/*

RUN COMMAND 
    => run immediate job for best item search [ user id, invertment amount ]

CACHE 
    => name, ema array, buy, sell, volumes for each item

BEST ITEM JOB 
    => get latest cache for all items 
    => sort closest to buy point 
    => 

*/
export function CachingJobs (agenda) {
    agenda.define('cache:api_res', async job => {
        console.log('Running cache job...');
        try {
            const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${process.env.API_KEY}`);
            const json = await api_res.json();

            const items = json['products'].map(function (product) {
                return product['id'] === 'ENCHANTED_CARROT_ON_A_STICK' ? undefined : {
                    'name': product['id'],
                    'buy': product['sell_summary'][0]['pricePerUnit'],
                    'sell': product['buy_summary'][0]['pricePerUnit'],
                    'volume': product['quick_status']['buyMovingWeek'],
                    'svolume': product['quick_status']['sellMovingWeek']
                }
            });
            
            const cache = new APICache({
                items,
                timestamp: new Date()
            });

            [ 2, 3, 4, 5 ]

            const doc = await cache.save();

            await agenda.schedule('in 2 hours', 'cache:purge', { cache_id: doc._id });

            for (const item of items) {
                // mArray[i] * k + emaArray[i - 1] * (1 - k)
                
            }
        } catch (err) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });

    agenda.define('cache:purge', async job => {
        try {
            console.log('Purging old cached response...');
            await APICache.findByIdAndDelete(job.attrs.data._id);

            await job.remove();
        } catch (error) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });
}