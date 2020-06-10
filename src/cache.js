import fetch from 'node-fetch'
import UserOrder from './models/userSchema'
import { client } from './client'
import fs from 'fs'
import path from 'path'
import { item_name } from './utils'

const range = 15;
const k = 2 / (range + 1);

export const cache_fp = path.resolve(process.env.DATA_DIR, 'cache.json');

let item_cache = {};

try {
    item_cache = JSON.parse(fs.readFileSync(cache_fp, 'utf-8'))
} catch (error) {
    // ignore error
}

export const backupCache = () => fs.promises.writeFile(cache_fp, JSON.stringify(item_cache));

export const cache_handler = async () => {
    try {
        console.log('Running job...');
        const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${process.env.API_KEY}`);
        const json = await api_res.json();

        const items = Object.keys(json['products']).map(function (key) {
            return {
                'name': json['products'][key]['product_id'],
                'buy': json['products'][key]?.['sell_summary']?.[0]?.['pricePerUnit'] ?? -1,
                'sell': json['products'][key]?.['buy_summary']?.[0]?.['pricePerUnit'] ?? -1,
                'volume': json['products'][key]?.['quick_status']?.['buyMovingWeek'] ?? -1,
                'svolume': json['products'][key]?.['quick_status']?.['sellMovingWeek'] ?? -1
            }
        });

        const buy_point = [];
        const sell_point = [];

        for (const item of items) {
            if (item.name === "ENCHANTED_CARROT_ON_A_STICK") continue;

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
                const pre_b_ema = item_cache[item.name].buy_ema;
                const pre_s_ema = item_cache[item.name].sell_ema;
                const pre_b = item_cache[item.name].buy;
                const pre_s = item_cache[item.name].sell;

                item_cache[item.name].buy = item.buy;
                item_cache[item.name].sell = item.sell;
                item_cache[item.name].volume = item.volume;
                item_cache[item.name].svolume = item.svolume;
                item_cache[item.name].buy_ema = item.buy * k + pre_b_ema * (1 - k);
                item_cache[item.name].sell_ema = item.sell * k + pre_s_ema * (1 - k);

                if ((pre_b <= pre_b_ema) && (item.buy > item_cache[item.name].buy_ema)) buy_point.push(item.name);
                if ((pre_s >= pre_s_ema) && (item.sell < item_cache[item.name].sell_ema)) sell_point.push(item.name);
            }
        }

        for (const item_id of sell_point) {
            const members = await UserOrder.find({ orders: item_id });
            for (const member of members) {
                client.users.cache.get(member.user_id).send(`You need to sell all your **${item_name(item_id)}** right now! [ Down ${Math.abs(item_cache[item_id].sell - item_cache[item_id].sell_ema).toFixed(2)} ]`);
                member.orders = member.orders.filter(ord => ord !== item_id);
                console.log(await member.save());
            }
        }

        /*const subscribers = await UserOrder.find({ subscribed: true });

        subscribers.forEach(member => {
            client.users.cache.get(member.user_id).send(`${buy_point.join(', ')} is currently at a optimal price to buy.`);
        });*/

        await backupCache();
    } catch (error) {
        console.log(error);
    }
}

export default item_cache;