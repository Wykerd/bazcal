import Agenda from 'agenda'
import mongoose from 'mongoose'
import { CachingJobs } from './jobs'

mongoose.Promise = global.Promise; // use the built in promise lib

mongoose.connect('mongodb://root:example@mongo:27017/', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
    .then(async () => {
        const agenda = new Agenda({ mongo: mongoose.connection.db, db: { collection: 'agendaJobs' } });
        
        CachingJobs(agenda);

        await agenda.start();
        console.log('Bazcal scheduler running.');

        const active_cache_jobs = await agenda.jobs({ name: 'cache:api_res' });

        if (active_cache_jobs.length > 0) console.log('Found existing caching job', active_cache_jobs.length, active_cache_jobs[0])
        else {
            await agenda.every('3 minutes', 'cache:api_res');
            console.log('Created new caching job');
        }
    })
    .catch(err => {
        throw err;
    });