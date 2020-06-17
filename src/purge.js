import User from './models/memberSchema'
import { client } from './client'

export default async function channel_purge_handler () {
    try {
        const cutoff = new Date(Date.now() - 180000); 
        const old_user_records = await User.find({ last_message: { $lt: cutoff }, channel_id: { $exists: true }, orders: { $size: 0 } })
        for (const doc of old_user_records) {
            try {
                const channel = client.guilds.cache.get(doc.server_id)?.channels?.cache?.get(doc.channel_id);
                await channel?.delete()
            } catch (error) {
                // 
            }
            doc.remove();
        }
    } catch (error) {
        console.error('Purge error', error);   
    }
}