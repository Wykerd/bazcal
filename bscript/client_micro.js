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

/*
config = {
    DISCORD_KEY,
    COMMAND_NAME,
    API_ENDPOINT,
    API_KEY,
    CACHE_FP,
    RANGE
}
*/
import globals from './builtins';
import './bz_micro';

const { Client } = require('discord.js');

const client = new Client();

window.start_client = function () {
    client.on('ready', function () {
        console.log('Bot started');
    });

    client.on('message', function (message) {
        if (message.content.startsWith(window.config.COMMAND_NAME)) {
            const _0 = {...globals};
            _0.arguments = message.content.substr(window.config.COMMAND_NAME.length).split(' ');
            if (_0.arguments[0] === '') _0.arguments.shift();
            _0.get_private_channel = function() {
                console.warn('No js implimentation for private channels');
                return message.channel;
            };
            
            _0.get_current_channel = function(){
                return message.channel;
            };
            
            _0.messages_sent = 0;
            _0.send_message = function (msg, channel) {
                try {
                    if (_0.messages_sent === 5) message.channel.send('<@'+message.author.id+'> Maximum send_message call limit reached');
                    _0.messages_sent++;
                    if (_0.messages_sent > 5) return false;
                    channel.send(msg);
                    return false;
                } catch (error) {
                    message.channel.send('<@'+message.author.id+'> Error: Runtime error: send_message threw error: '+error.message);
                    return false;
                }
            };
            try {
                window.compiled_code(_0, message);   
            } catch (error) {
                message.channel.send('<@'+message.author.id+'> Error: '+error.message);
            }
        }
    });
    
    client.login(window.config.DISCORD_KEY);
}

export default client;