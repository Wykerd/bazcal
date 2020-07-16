/* This file is used to delete all the channels after they have been created for the different users
It's written as an async function, because we need find the user in the MongoDB */

import User from './models/memberSchema'
import { client } from './client'

export default async function channel_purge_handler () {
    try {
        // Cutoff is calculated as a date 3 min ago (3 * 60 * 1000)
        const cutoff = new Date(Date.now() - 180000); 
        // Cutoff, Orders and Channel ID checked to find all users' channels to delete
        const old_user_records = await User.find({ last_message: { $lt: cutoff }, channel_id: { $exists: true }, orders: { $size: 0 } })
        // Loops through users' records to delete their channels
        for (const doc of old_user_records) {
            try {
                // Using the data in the user's doc to find the channel and delete it
                const channel = client.guilds.cache.get(doc.server_id)?.channels?.cache?.get(doc.channel_id);
                await channel?.delete()
            } catch (error) {
                // Ignored this error, because it should never occur
            }
            doc.remove();
        }
    } catch (error) {
        console.error('Purge error', error);   
    }
}