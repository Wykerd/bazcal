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

 // Import the displaynames for each item
const items = require('../items.json');

// Used to generate the image for the auction flips
import { getGlyph, getItems } from 'sb-glyph';
import { loadImage, createCanvas } from 'canvas';

// Imports the item cache for Bazaar
import { item_cache, demand_cache } from './cache'

import User from './models/memberSchema'
import { client } from './client';
import sorted_flips from './auc_cache';

// Limits a value between 2 numbers (limit(8, 2, 5) -> 5)
function limit(val, min, max) {
    return val < min ? min : (val > max ? max : val)
}

export async function get_member (message) {
    // Tries to find a member with the same ID as the message that has been sent
    let member = await User.findOne({ user_id: message.author.id, server_id: message.guild.id })

    // Tries to get the user's channel or creates one for him
    const channel = await get_user_channel(message, member);

    // Creates a new member if no member was found with the channel saved
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
    // Checks to see if the user has an existing channel
    if (member?.channel_id) {
        try {
            // fetches the channel from guild
            const channel = await message.guild.channels.cache.get(member.channel_id)
            if (channel) return channel;
        } catch (error) {
            member.channel_id = '';
        }
    }

    const server = message.guild;
    const name = message.author.tag.replace(/#/g, '_');

    // Channel does not exist, creates one with universal name
    const channel = await server.channels.create(`bz_${name}`, { 
        type: 'text', 
        topic: 'This channel will be deleted after 3 minutes if you have no pending orders', 
        // Gives the bot and user permissions to view the channel (admins always get access)
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

// Uses information and translates it to expand the existing array with usable values
export function raw_advise (balance) {
    const unsorted = []
    for (const product_name in item_cache) {
        // Fetches the item data from the cache in memory
        const product = item_cache[product_name]
        const demand = demand_cache[product_name]

        // Calculates profit per item with tax included
        const profit = (product.sell * 0.99) - product.buy

        // Takes the minimum volume per week, convers it to 5 minutes, limits it to your balance
        const tvolume = Math.min(product.volume - demand.volume[0], product.svolume - demand.svolume[0]);
        const evolume = Math.floor(limit(tvolume, 0, balance / product.buy));

        // Times the effective volume you can afford with the profit of the item
        const eprofit = (evolume * profit)

        // Pushes the values to an array
        unsorted.push({
            'name': product_name,
            'evolume': evolume,
            'invested': (product.buy * evolume),
            'eprofit': eprofit,
            // Percentage money invested and profit
            'pinvested': (((product.buy * evolume) * 100) / balance).toFixed(1),
            'pprofit': ((profit / product.buy) * 100).toFixed(1),

            // Calculates the trend of the item sell value with EMA
            'gradient': product.sell - product.sell_ema
        })
    }
    return unsorted;
}

/* Uses raw_advise to aquire the expanded array
Used to sort and filter the array with predefined conditions */

export function advise(balance, count = 6, include_stablity = true, volume_cap = 50) {
    // Calls the function to get the expanded array
    const unsorted = raw_advise(balance);

    // Basic Sort function
    const sorted = unsorted.sort((a, b) => {
        return b.eprofit - a.eprofit
    })

    console.log(sorted[0]);

    // Check if it should be filtered
    if (include_stablity) {
        // Define filter conditions
        const buy_trend = (item) => item_cache[item.name].buy > item_cache[item.name].buy_ema;
        const sell_trend = (item) => item_cache[item.name].sell > item_cache[item.name].sell_ema;

        const low_volume_filter = (item) => item.evolume > volume_cap;

        return sorted.filter(item => buy_trend(item) && sell_trend(item) && low_volume_filter(item)).slice(0, count);
    }

    // Returns unfiltered array
    return sorted.slice(0, count);
}

// Used to convert user typed item names to usable onces (ghast tear -> GHAST_TEAR)
export function item_name (item_id) {
    return items[item_id]?.name ?? item_id.replace('_', ' ');
}

// Converts short numbering to a complete integer (10M -> 10000000)
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

// Formats a big number into more readable number (10000000 -> 10M)
export function formatNumber(number) {
    if (number >= 1000000) {
        return formatter.format(round(number / 1000000, 2)) + 'M'
    } else if (number >= 1000) {
        return formatter.format(round(number / 1000, 2)) + 'K'
    } else {
        return round(number, 2)
    }
}

// Used to round a number to a certain amount of decimals (2.016456 -> 2.02)
export function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}

export function advise_formatter (array) {
    return array.map((item, i) => {`${i + 1}: **${_0.item_name(item.name)}**\nQuantity: **${item.evolume}**\nInvested: **${_0.format_number(item.invested)}** _(${item.pinvested}%)_\nEstimated Profit: **${_0.format_number(item.eprofit)}** _(${item.pprofit}%)_\nSell price trend: **${item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing'}**`}).join('\n\n');
}

export function ah_suggest (balance, time, count = 6, top = 0.25) {
    const affordable = sorted_flips.filter(item => (item[2] <= balance));

    for (const item of affordable) {
        item[0] = item[0].filter(it => ((it.end - Date.now()) <= time) && ((it.end - Date.now()) > 120000));
    }

    const possible = affordable.filter(item => (item[0].length > 0) && (item[1] > 0));

    const Q1 = possible.length * top;
    const profitable = possible.slice(0, Q1 >= count ? Q1 : count);

    const picks = [];

    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * profitable.length);
        const rem = profitable.splice(index, 1);
        const item = rem[0];
        const auction = item[0][Math.floor(Math.random() * item[0].length)]
        auction._profit = item[1];
        auction._bid_price = item[2];
        picks.push(auction);
    }

    return picks;
}

// Converts milliseconds to a readable time for the users
export function msToTime(ms) {
    const secs = parseInt((ms/1000)%60)
    , mins = parseInt((ms/(1000*60))%60)
    , hrs = parseInt((ms/(1000*60*60))%24);

  
    if (hrs === 0) {
        if (mins === 0) return secs + 's';
        return mins + 'm ' + secs + 's';
    }
    return hrs + 'h ' + mins + 'm ' + secs + 's';
}

/**
 * @param {import('canvas').CanvasRenderingContext2D} ctx 
 * @param {*} item 
 * @param {*} x 
 * @param {*} y 
 */
async function drawCard (ctx, item, x, y) {
    const items = await getItems(item.item_bytes, true);

    const name = items[0].display_name.split('§');

    ctx.fillStyle = '#23272A';

    ctx.fillRect(10 + (x * 600), 150 + (y * 168), 590, 158);
    
    const buf = await getGlyph(items[0], 'cache');

    if (buf) {
        const glyph = await loadImage(buf);
        ctx.drawImage(glyph, 20 + (x * 600), ((158 / 2) - (glyph.height / 2)) + 150 + (y * 168));
    }

    let offset = 0;
    ctx.font = 'bold 28px sans-serif';
    for (const section of name) {

        const color_code = section.charAt(0);
        const str = section.substr(1);

        switch (color_code) {
            case '0':
                ctx.fillStyle = '#000000';
                break;

            case '1':
                ctx.fillStyle = '#0000AA';
                break;

            case '2':
                ctx.fillStyle = '#00AA00';
                break;

            case '3':
                ctx.fillStyle = '#00AAAA';
                break;

            case '4':
                ctx.fillStyle = '#AA0000';
                break;

            case '5':
                ctx.fillStyle = '#AA00AA';
                break;
                
            case '6':
                ctx.fillStyle = '#FFAA00';
                break;

            case '7':
                ctx.fillStyle = '#AAAAAA';
                break;

            case '8':
                ctx.fillStyle = '#555555';
                break;

            case '9':
                ctx.fillStyle = '#5555FF';
                break;
                
            case 'a':
                ctx.fillStyle = '#55FF55';
                break;

            case 'b':
                ctx.fillStyle = '#55FFFF';
                break;

            case 'c':
                ctx.fillStyle = '#FF5555';
                break;

            case 'd':
                ctx.fillStyle = '#FF55FF';
                break;
                
            case 'e':
                ctx.fillStyle = '#FFFF55';
                break;

            case 'f':
                ctx.fillStyle = '#FFFFFF';
                break;
        
            default:
                ctx.fillStyle = '#fff';
                break;
        }

        const len = ctx.measureText(str);

        ctx.fillText(str, 172 + (x * 600) + offset, 194 + (y * 168));

        offset += len.width;
    }

    ctx.fillStyle = '#AAAAAA';

    ctx.font = '22px sans-serif';
    ctx.fillText('Price: ', 172 + (x * 600), 230 + (y * 168));
    ctx.fillText('Profit: ', 172 + (x * 600), 257 + (y * 168));
    ctx.fillText('Time left: ', 172 + (x * 600), 284 + (y * 168));

    ctx.fillStyle = '#fff';

    ctx.fillText(formatNumber(item._bid_price) + ' coins', 172 + (x * 600) + ctx.measureText('Price: ').width, 230 + (y * 168));
    ctx.fillText(formatNumber(item._profit), 172 + (x * 600) + ctx.measureText('Profit: ').width, 257 + (y * 168));
    ctx.fillText(msToTime(item.end - Date.now()), 172 + (x * 600) + ctx.measureText('Time left: ').width, 284 + (y * 168));
}

export async function flip_image (items) {
    const canvas = createCanvas(1200, 654);

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff';

    ctx.font = 'bold 50px sans-serif';

    ctx.fillText('Skyblock Auctions', 600 - (ctx.measureText('Skyblock Auctions').width / 2), 65);

    ctx.font = '40px sans-serif';

    ctx.fillText('G r e a t   F l i p s', 600 - (ctx.measureText('G r e a t   F l i p s').width / 2), 120);

    for (let i = 0; i < 6; i++) {
        await drawCard(ctx, items[i], i % 2, Math.floor(i / 2))
    }

    return canvas;
}
