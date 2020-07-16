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
import { item_name, formatNumber, advise, get_user_channel, get_member } from '../utils'

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const handler = async (message, args) => {
    // Gets the user and userchannel
    const member = await get_member(message);
    const channel = await get_user_channel(message, member);

    member.last_message = new Date();
    member.channel_id = channel.id;

    // Saves new user info
    await member.save();

    const time = parseInt(args[1])

    const defaults = message._server_doc.advice_defaults;

    // Calls the advice command in utils
    const sorted_input = advise(args[0], message._server_doc.results, Number.isNaN(time) ? defaults.timeframe : time, args[2] ? args[2].toLowerCase() === 'true' : defaults.include_stablity);

    /*
    item_index
    item_id
    item_name
    quantity
    invested
    invested_short
    invest_percentage
    estimated_profit
    estimated_profit_short
    estimated_profit_percentage
    sell_trend
    */

    // Formatting for response
    let response = message._server_doc.message_templates.advice.header
        .replace(/{{balance}}/gi, args[0]);

    response += sorted_input.map((item, i) => message._server_doc.message_templates.advice.format
        .replace(/{{item_index}}/gi, i + 1)
        .replace(/{{item_id}}/gi, item.name)
        .replace(/{{item_name}}/gi, item_name(item.name))
        .replace(/{{quantity}}/gi, item.evolume)
        .replace(/{{invested}}/gi, item.invested.toFixed(2))
        .replace(/{{invested_short}}/gi, formatNumber(item.invested.toFixed(2)))
        .replace(/{{invest_percentage}}/gi, item.pinvested)
        .replace(/{{estimated_profit}}/gi, item.eprofit.toFixed(2))
        .replace(/{{estimated_profit_short}}/gi, formatNumber(item.eprofit.toFixed(2)))
        .replace(/{{estimated_profit_percentage}}/gi, item.pprofit)
        .replace(/{{sell_trend}}/gi, item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing')
    ).join('\n\n');

    response += '\n\n_This data is updated every 30 seconds_';

    message.channel.send(message._server_doc.message_templates.advice.instruction.replace(/{{user}}/gi, `<@${message.author.id}>`));

    channel.send(`<@${message.author.id}>\n` + response);
}

export default handler;