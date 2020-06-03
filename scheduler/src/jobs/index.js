import fetch from 'node-fetch'
import APICache from '../models/cache'

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

            const saved = await cache.save();

            await agenda.schedule('in a week', 'cache:purge', { cache_id: saved._id });
        } catch (err) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });

    agenda.define('cache:purge', async job => {
        try {
            await APICache.findByIdAndDelete(job.attrs.data._id);
            await job.remove();
        } catch (error) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    });
}