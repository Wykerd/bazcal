import schedule from 'node-schedule'
import mongoose from 'mongoose'
import { cache_handler } from './cache'

mongoose.Promise = global.Promise

mongoose.connect('mongodb://root:example@mongo:27017/', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
    .then(async () => {
        schedule.scheduleJob('*/30 * * * * *', cache_handler)
    })
    .catch(err => {
        throw err
    })