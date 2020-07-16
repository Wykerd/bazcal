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
import fetch from 'node-fetch'
import UserOrder from './models/memberSchema'
import { client } from './client'
import fs from 'fs'
import path from 'path'
import { item_name } from './utils'

// Setup for the EMA calculation for Bazaar predictions with notif
const range = 12;
const k = 2 / (range + 1);

// Gets the current cache from the file
export const cache_fp = path.resolve(process.env.DATA_DIR, 'cache.json');

let item_cache = {};

try {
    item_cache = JSON.parse(fs.readFileSync(cache_fp, 'utf-8'))
} catch (error) {
    // ignore error
}

// The function used to backup the cache in case of memory overflow or failure
export const backupCache = () => fs.promises.writeFile(cache_fp, JSON.stringify(item_cache));

// Handler called in index.js every 30 seconds
export const cache_handler = async () => {
    try {
        console.log('Running job...');

        // Fetches the new data from the API
        const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${process.env.API_KEY}`);
        const json = await api_res.json();

        // Maps all the nessasary information from the while response
        const items = Object.keys(json['products']).map(function (key) {
            return {
                'name': json['products'][key]['product_id'],
                'buy': json['products'][key]?.['sell_summary']?.[0]?.['pricePerUnit'] + 0.1 ?? -1,
                'sell': json['products'][key]?.['buy_summary']?.[0]?.['pricePerUnit'] - 0.1 ?? -1,
                'volume': json['products'][key]?.['quick_status']?.['buyMovingWeek'] ?? -1,
                'svolume': json['products'][key]?.['quick_status']?.['sellMovingWeek'] ?? -1
            }
        });

        const buy_point = [];
        const sell_point = [];

        for (const item of items) {
            // This item is not used as it always has 0 buy orders and no worth
            if (item.name === "ENCHANTED_CARROT_ON_A_STICK") continue;

            // Checks to see if a new item must be added to cache (in a new update for example)
            if (!item_cache[item.name]) {
                item_cache[item.name] = {
                    buy: item.buy,
                    sell: item.sell,
                    volume: item.volume,
                    svolume: item.svolume,
                    buy_ema: item.buy,
                    sell_ema: item.sell
                }
            } else {
                // Loads the previous values to include the new ones
                const pre_b_ema = item_cache[item.name].buy_ema;
                const pre_s_ema = item_cache[item.name].sell_ema;
                const pre_b = item_cache[item.name].buy;
                const pre_s = item_cache[item.name].sell;

                // Adds the new data to the file for use
                item_cache[item.name].buy = item.buy;
                item_cache[item.name].sell = item.sell;
                item_cache[item.name].volume = item.volume;
                item_cache[item.name].svolume = item.svolume;

                // Uses a the EMA formula to move the new value
                item_cache[item.name].buy_ema = item.buy * k + pre_b_ema * (1 - k);
                item_cache[item.name].sell_ema = item.sell * k + pre_s_ema * (1 - k);

                // Checks the item's position with the EMA prediction definition
                if ((pre_b <= pre_b_ema) && (item.buy > item_cache[item.name].buy_ema)) buy_point.push(item.name);
                if ((pre_s >= pre_s_ema) && (item.sell < item_cache[item.name].sell_ema)) sell_point.push(item.name);
            }
        }

        // This part is used to notify users who need to sell their products
        for (const item_id of sell_point) {
            // Finds all members with orders with the items they must sell
            const members = await UserOrder.find({ orders: item_id });
            for (const member of members) {
                try {
                    // Notifies all the users and set the channel topic to inform them how many are pending
                    const channel = client.guilds.cache.get(member.server_id)?.channels?.cache?.get(member.channel_id);
                    channel?.send(`<@${member.user_id}> You need to sell all your **${item_name(item_id)}** right now!`)?.catch(()=>{});
                    member.orders = member.orders.filter(ord => ord !== item_id);
                    if (!member.orders.length) channel?.setTopic('No orders in queue. This channel will delete in 3 minutes after the last message has been sent.').catch(()=>{});
                    member.last_message = new Date();
                    console.log(await member.save());   
                } catch (error) {
                    member.remove()
                }
            }
        }

        // Mades a backup / copy of the cache stored in memory
        await backupCache();
    } catch (error) {
        console.log(error);
    }
}

export default item_cache;