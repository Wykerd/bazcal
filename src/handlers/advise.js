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
import item_cache from '../cache'

import { item_name, formatNumber, advise, get_user_channel, get_member } from '../utils'

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const handler = async (message, args) => {
    const member = await get_member(message);
    const channel = await get_user_channel(message, member);

    member.last_message = new Date();
    
    member.channel_id = channel.id;

    await member.save();

    const time = parseInt(args[1])

    const sorted_input = advise(args[0], 6, Number.isNaN(time) ? 15 : time, args[2]?.toLowerCase() === 'true')

    let response = sorted_input.map((item, i) => `${i + 1}: **${item_name(item.name)}**\nQuantity: **${item.evolume}**\nInvested: **${formatNumber(item.invested.toFixed(2))}** _(${item.pinvested}%)_\nEstimated Profit: **${formatNumber(item.eprofit.toFixed(2))}** _(${item.pprofit}%)_\nSell price trend: **${item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing'}**`).join('\n\n');

    response += '\n\n_This data is updated every 30 seconds_';

    message.channel.send(`<@${message.author.id}> I've sent you advice in your channel`);

    channel.send(`<@${message.author.id}>\n` + response);
}

export default handler;