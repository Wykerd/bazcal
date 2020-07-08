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

import Config from '../models/configSchema';
import YAML from 'yaml';
import { client } from '../client';

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
export const ConfigHandler =  async (message, args) => {
    const config = message._server_doc;
    if (!config) throw Error('\n**Bazcal Server Config Manager**\nNo existing config found.');
    switch (args[0]) {
        case 'delete':
            const channel = client.guilds.cache.get(config.server_id)?.channels?.cache?.get(config.category_id);
            await channel?.delete();
            await config.remove();
            await message.channel.send('Deleted existing config.');
            return;

        case 'help':
            await message.channel.send('**Bazcal Server Config Manager**\n\n\`fix\` recreate the _Bazcal_ category when getting \`parent_id doesnt exist\` error.\n\n\`advise\` Customize the default parameters for Bazcal\'s advise command. Params: <timeframe> <include_stability>\n\n\`bscript\` Configure BScript for your server (limited at the moment). Params: <allow_current_channel>\n\n\`results\` Set the amount of results to return when using `!bz notif\` or \`!bz advise\`. Params: <results>')
            return; 

        case 'advise':
            const [ _, timeframe, include_stability ] = args;
            let tf = parseInt(timeframe ?? 15);
            if (Number.isNaN(tf)) tf = 15;
            const is = include_stability === 'true';
            config.advice_defaults.timeframe = tf;
            config.advice_defaults.include_stability = is;
            await config.save();
            await message.channel.send('**Bazcal Server Config Manager**\n\nUpdated config!');
            return;

        case 'fix':
            const category = await message.guild.channels.create(`Bazcal`, { 
                type: 'category'
            });
            const category_id = category.id;
            config.category_id = category_id;
            await config.save();
            await message.channel.send('**Bazcal Server Config Manager**\n\nDone!');
            return;

        case 'bscript':
            config.bscipt.force_channel_messages = args[1] === 'true';
            await config.save();
            await message.channel.send('**Bazcal Server Config Manager**\n\nUpdated config!');
            return;
        
        case 'results':
            const [ _2, results ] = args;
            let res = parseInt(results ?? 6);
            if (Number.isNaN(res)) res = 6;
            await config.save();
            if ((res < 1) || (res > 10)) {
                throw new Error('\n\n**Bazcal Server Config Manager**\n\nResults returned must be between 1 and 10');
            }
            config.results = res;
            await config.save();
            await message.channel.send('**Bazcal Server Config Manager**\n\nUpdated config!');
            return;

        default:
            break;
    }
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
export const ConfigGenerator = async (message, args) => {
    if (!message.guild) throw new Error('I only work in servers.');
    const config = await Config.findOne({ server_id: message.guild.id })
    if (config) throw new Error('\n**Bazcal Server Config Manager**\nThis server already has config use `!bz config help` for help on configuring the server')
    const category = await message.guild.channels.create(`Bazcal`, { 
        type: 'category'
    });
    const category_id = category.id;
    const new_config = new Config({
        category_id,
        server_id: message.guild.id
    });
    await new_config.save();
    await message.channel.send('**Bazcal Server Config Manager**\nGenerated default config. Use `!bz config help` for help on configuring the server');
} 

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
export const ConfigLoader = async (message, args) => {
    if (!message.guild) throw new Error('I only work in servers.');
    const config = await Config.findOne({ server_id: message.guild.id })
    if (!config) throw new Error('\n**Bazcal Server Config Manager**\nHey! Bazcal is an amazing bot for bazaar trading and we know you\'re eager to use it on this server, but before you can use it on this server a user with **Admin** permissions must create the server config.\n\nTo generate a default configuration run `!bz init` and follow the steps from there.');
    message._server_doc = config;
}