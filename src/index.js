/**
 *  This file is part of Bazcal.
 *
 *  Bazcal is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Bazcal is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
 */
import schedule from 'node-schedule'
import mongoose from 'mongoose'
import { cache_handler } from './cache'
import channel_purge_handler from './purge'
import app from './web/app'
import { cache_flip } from './auc_cache'

mongoose.Promise = global.Promise

// Connects to the MongoDB and scedules all the nessasary services to run which needed to be recorded
mongoose.connect('mongodb://root:example@mongo:27017/', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
    .then(async () => {
        // Scedule to update the [Bazaar] cache every 30 seconds 
        schedule.scheduleJob('*/30 * * * * *', cache_handler)
        // Scedule to check which channels to delete every second
        schedule.scheduleJob('*/1 * * * *', channel_purge_handler)
        // Starts the web-app for Bazcal
        app.listen(process.env.PORT ?? 80, () => console.log('Express server started!'))
        // Starts the auction cache process
        await cache_flip();
    })
    .catch(err => {
        throw err
    })