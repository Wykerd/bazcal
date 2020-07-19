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
import { item_cache } from '../cache'

import { item_name, formatNumber, advise } from '../utils'

const item_name_obj = require('../../items.json');

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const handler = async (message, args) => {
    // Replaces to universal item name and finds it in the cache
    let item = item_cache[args[0].toUpperCase().replace(/ /g, '_')]

    // Attempts to find another name for the item
    if (!item) {
        const item_id = Object.keys(item_name_obj).find(id => item_name_obj[id].name.toUpperCase() === args[0].toUpperCase());
        if (!item_id) throw new Error('Item with name **' + args[0] + '** not found');
        item = item_cache[item_id];
    }

    if (!item) throw new Error('Item with name **' + args[0] + '** not found');

    message.channel.send(`<@${message.author.id}> **${args[0]}**\n\nBuy: **${formatNumber(item.buy)}**\nSell: **${formatNumber(item.sell)}**\nBuy Volume: **${formatNumber(item.volume)}**\nSell Volume: **${formatNumber(item.svolume)}**\nBuy trend: **${item.buy > item.buy_ema ? 'Value increasing' : 'Value decreasing'}**\nSell trend: **${item.sell > item.sell_ema ? 'Value increasing' : 'Value decreasing'}**`);
}

export default handler;