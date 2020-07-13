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
import { get_user_channel, get_member, ah_suggest, flip_image } from '../utils'
import humanInterval from 'human-interval';
import { MessageAttachment } from 'discord.js'
import sorted_flips from '../auc_cache';

const { NUMBER_EMOJI } = require('../../config.json')

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const handler = async (message, args) => {
    const member = await get_member(message);

    const userID = message.author.id

    /**
     * @param {import('discord.js').TextChannel} channel 
     */
    async function send_flips(channel) {
        const balance = args.shift();
        const humanTime = args.join(' ');

        let time = 300000;
        if (humanTime !== '') {
            const humanMs = humanInterval(humanTime);
            if (!Number.isNaN(humanMs)) time = humanMs;
        }

        if (sorted_flips.length === 0) throw new Error('The AH Flip command is either broken or initializing...');

        const sorted_input = ah_suggest(balance, time);

        if (sorted_input.length === 0) await channel.send(`<@${member.user_id}> No results were found.`);

        const attachment = new MessageAttachment((await flip_image(sorted_input)).toBuffer('image/png'), 'suggestions.png');   
        const main = await channel.send(`<@${member.user_id}> React to receive the command to locate the auction. Confirm with :thumbsup:`, attachment);

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
        const auctions = []

        for (const i of reaction_array) {
            auctions.push(sorted_input[i].uuid.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{11})/, "$1-$2-$3-$4-$5"))
        }

        return auctions;
    }

    const channel = await get_user_channel(message, member);

    // pre save record to keep track of channel
    member.channel_id = channel.id;
    member.last_message = new Date();

    // just always save I'm not even gonna check anymore
    await member.save();

    await message.channel.send('Check you channel :-)');

    const auctions = await send_flips(channel);

    if (auctions) channel.send('Copy the commands to view the auctions:\n\n' + auctions.map(uuid => `/viewauction ${uuid}`).join('\n'));   
}

export default handler

