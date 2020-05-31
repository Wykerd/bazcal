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

            await cache.save();
        } catch (err) {
            console.error('JOB FAILED', err);
            job.fail(err);
        }
    })
}