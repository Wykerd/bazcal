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

const { NUMBER_EMOJI } = require('../../config.json')

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const handler = async (message, args) => {
    const templates = message._server_doc.message_templates.notif;
    const member = await get_member(message);

    const userID = message.author.id

    /**
     * @param {import('discord.js').TextChannel} channel 
     */
    async function send_advice(channel) {
        const sorted_input = advise(args[0], message._server_doc.results);

        if (sorted_input.length === 0) await channel.send(templates.no_results);

        const main = await channel.send(`<@${member.user_id}>\n` + templates.header + advice_message(sorted_input) + '\n\n' + templates.footer)

        // Setup for the react
        for (let i = 0; i < sorted_input.length; i++) {
            await main.react(NUMBER_EMOJI[i])
        }

        await main.react('👍')

        const filter = (reaction, user) => {
            return NUMBER_EMOJI.includes(reaction.emoji.name) && user.id === userID
        }

        // Asks which orders he would like to invest in
        const reaction_array = []

        /**
         * @param {import('discord.js').Message} message 
         */
        async function awaitReaction(message) {
            const collected = await message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            const reaction = collected.first()

            if (reaction.emoji.name != '👍') {
                reaction_array.push(NUMBER_EMOJI.indexOf(reaction.emoji.name))
                return await awaitReaction(message)
            }
        }

        try {
            await awaitReaction(main)   
        } catch (error) {
            // ignore error
            main.delete();
            return false;
        }

        //Converts reaction to orderIDs
        const orders = []

        for (const i of reaction_array) {
            orders.push(sorted_input[i].name)
        }

        return orders;
    }

    const channel = await get_user_channel(message, member);

    // pre save record to keep track of channel
    member.channel_id = channel.id;
    member.last_message = new Date();

    // just always save I'm not even gonna check anymore
    await member.save();

    if (templates.instruction) await message.channel.send(templates.instruction.replace(/{{user}}/gi, `<@${message.author.id}>`))

    const orders = await send_advice(channel);

    if (!orders || orders?.length === 0) return;
    
    if (member?.orders?.length > 0) {
        const new_message = await channel.send(templates.pending)

        await new_message.react('👍')
        await new_message.react('👎')

        //Ask if he wants previous orders to be updated or cancelled
        const filter = (reaction, user) => ['👍', '👎'].includes(reaction.emoji.name) && user.id === userID

        let collected;
        try {
            collected = await new_message.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
            const reaction = collected.first()

            if (reaction.emoji.name === '👍') {
                // Update Previous
                for (let order of orders) {
                    if (!member.orders.includes(order)) {
                        member.orders.push(order)
                    }
                }
                await member.save()
            } else {
                //Cancel Previous
                member.orders = orders
                await member.save()
            }
        } catch (error) {
            // ignore error as it is time out
            return;
        }
    } else {
        member.orders = orders;
        await member.save()
    }
    
    if (channel) {
        channel.send(templates.confirmed)

        let updated = false;

        if (orders) for (let order of orders) {
            if (item_cache[order].sell < item_cache[order].sell_ema) {
                channel.send(`<@${member.user_id}> You need to sell all your **${item_name(order)}** right now!`);
                member.orders = member.orders.filter(ord => ord !== order);
                updated = true;
            } 
        }

        if (updated) await member.save();
    }
}

/**
 * @param {import('discord.js').Message} message 
 */
export function TradeConverseAdapter (message, entities, nlp_res) {
    const nums = entities.filter(entity => entity.entity === 'number');

    if (nums.length === 0) throw new Error('I couldn\'t find any balance referenced in your message...');

    if (message.guild) message.channel.send(`<@${message.author.id}> ${nlp_res?.answer || 'Check your channel'}`)

    return handler(message, nums.map(num => num.resolution?.value ?? 0));
}

function advice_message(sorted_input) {
    let final_message = ''
    for (const item in sorted_input) {
        final_message += `${parseInt(item) + 1}: **${item_name(sorted_input[item].name)}**\n`
        final_message += `Quantity: **${sorted_input[item].evolume}**\n`
        final_message += `Invested: **${formatNumber(sorted_input[item].invested)}** _(${sorted_input[item].pinvested}%)_\n`
        final_message += `Minimum Profit: **${formatNumber(sorted_input[item].eprofit.toFixed(2))}** _(${sorted_input[item].pprofit}%)_\n\n`
    }
    return final_message.trim();
}

export default handler

