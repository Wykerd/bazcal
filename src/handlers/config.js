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
    switch (args[0]) {
        case 'delete':
            const config = await Config.findOne({ server_id: message.guild.id });
            if (!config) throw Error('\n**Bazcal Server Config Manager**\nNo existing config found.');
            const channel = client.guilds.cache.get(config.server_id)?.channels?.cache?.get(config.category_id);
            await channel?.delete();
            await message.channel.send('Deleted existing config.');
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
    await message.channel.send('**Bazcal Server Config Manager**\nGenerated default config. Use `!bz config help` for help on configuring the server\n```yaml\n'+YAML.stringify(new_config)+'```');
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