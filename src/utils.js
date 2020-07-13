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
const items = require('../items.json');

import item_cache from './cache'

import User from './models/memberSchema'
import { client } from './client';

function limit(val, min, max) {
    return val < min ? min : (val > max ? max : val)
}

export async function get_member (message) {
    let member = await User.findOne({ user_id: message.author.id, server_id: message.guild.id })

    const channel = await get_user_channel(message, member);

    if (!member) {
        member = new User({
            user_id: message.author.id,
            server_id: message.guild.id,
            channel_id: channel.id,
            last_message: new Date(),
            orders: []
        })
    }
    
    return member;
}

/**
 * Get the channel of the user
 * @param {import('discord.js').Message} message 
 * @param {*} member 
 */
export async function get_user_channel (message, member) {
    if (member?.channel_id) {
        try {
            const channel = await message.guild.channels.cache.get(member.channel_id)
            if (channel) return channel;
        } catch (error) {
            member.channel_id = '';
        }
    }

    const server = message.guild;
    const name = message.author.tag.replace(/#/g, '_');

    const channel = await server.channels.create(`bz_${name}`, { 
        type: 'text', 
        topic: 'This channel will delete after 3 minutes in which you have no orders pending', 
        permissionOverwrites: [
            {
                id: message.guild.id,
                deny: ['VIEW_CHANNEL'],
            },
            {
                id: message.author.id,
                allow: ['VIEW_CHANNEL'],
            },
            {
                id: client.user.id,
                allow: ['VIEW_CHANNEL']
            }
        ],
        parent: message._server_doc.category_id
    });

    return channel;
}

export function raw_advise (balance, time = 5, include_stablity = true) {
    const unsorted = []
    for (const product_name in item_cache) {
        const product = item_cache[product_name]
        const profit = (product.sell * 0.99) - product.buy

        const tvolume = (Math.min(product.volume, product.svolume) / 10080) * time
        const evolume = Math.floor(limit(tvolume, 0, balance / product.buy))

        const eprofit = (evolume * profit)

        unsorted.push({
            'name': product_name,
            'evolume': evolume,
            'invested': (product.buy * evolume),
            'pinvested': (((product.buy * evolume) * 100) / balance).toFixed(1),
            'eprofit': eprofit,
            'pprofit': ((profit / product.buy) * 100).toFixed(1),
            'gradient': product.sell - product.sell_ema
        })
    }
    return unsorted;
}

export function advise(balance, count = 6, time = 5, include_stablity = true, volume_cap = 50000) {
    const unsorted = raw_advise(balance, time, include_stablity);

    const sorted = unsorted.sort((a, b) => {
        return b.eprofit - a.eprofit
    })

    if (include_stablity) return sorted.filter(item => (item_cache[item.name].buy > item_cache[item.name].buy_ema) && (item_cache[item.name].sell > item_cache[item.name].sell_ema) && (item.evolume > (volume_cap * 10080 / time))).slice(0, count)
    
    return sorted.slice(0, count);
}

export function item_name (item_id) {
    return items[item_id]?.name ?? item_id.replace('_', ' ');
}

export function convertNumber(input) {
    let exp = /[A-z]+/.exec(input)
    let num = /[+-]?([0-9]*[.])?[0-9]+/.exec(input)

    if (exp[0].toUpperCase() == 'M' || exp[0].toUpperCase() == 'MIL') {
        return num[0] * 1000000
    } else if (exp[0].toUpperCase() == 'K') {
        return num[0] * 1000
    }
    
    return false;
}

const formatter = new Intl.NumberFormat()

export function formatNumber(number) {
    if (number >= 1000000) {
        return formatter.format(round(number / 1000000, 2)) + 'M'
    } else if (number >= 1000) {
        return formatter.format(round(number / 1000, 2)) + 'K'
    } else {
        return round(number, 2)
    }
}

export function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}
