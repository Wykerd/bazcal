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

import UserScript from '../models/scriptSchema';

import { Parser, InputStream, TokenStream, Environment, StaticallyLink } from "../../lib/index"

import { item_name, formatNumber, advise, get_user_channel, get_member, raw_advise, convertNumber } from '../utils'
import { AdvancedHelp, AdvancedPublicHelp } from './info';

/**
 * Base handler for advanced messages
 * @param {import('discord.js').Message} message 
 * @param {any[]} args 
 */
const handler = (message, args) => {
    const command = args.shift();
    switch (command) {
        case 'parse':
            return advanced_parse_check(message, args);
        case 'export':
            return advanced_export(message, args);
        case 'eval':
            return advanced_eval(message, args);
        case 'delete':
            {
                if (args.length < 1) throw new Error('Invalid arguments. Expected 2 or more arguments, got ' + (args.length + 1));
                const name = args.shift();
                return advanced_delete_script(message, name);
            }
        case 'save':
            {
                if (args.length < 2) throw new Error('Invalid arguments. Expected 3 or more arguments, got ' + (args.length + 1));
                const name = args.shift();
                return advanced_save(message, name, args);
            }
        case 'run':
            {
                if (args.length < 1) throw new Error('Invalid arguments. Expected 2 or more arguments, got ' + (args.length + 1));
                const name = args.shift();
                return advanced_run(message, name, args);
            }
        case 'set_name':
            {
                if (args.length < 2) throw new Error('Invalid arguments. Expected 3 or more arguments, got ' + (args.length + 1));
                const [ name, globName ] = args;
                return advanced_set_global_name(message, name, globName.toLowerCase());
            }
        case 'public':
            return advanced_public_commands(message, args);
        case 'help':
            return AdvancedHelp(message);
        default:
            return advanced_run_public(message, command.toLowerCase(), args);
            break;
    }
}

const advanced_public_commands = async (message, args) => {
    if (args.length < 1) throw new Error('Invalid arguments. Expected 2 or more arguments, got ' + (args.length + 1));
    const command = args.shift();
    async function get_script () {
        const script_name = args.shift();
        const split_name = script_name.split('/');
        let script_doc;
        if (split_name.length === 2) script_doc = await UserScript.findOne({ user_id: split_name[0], script_name: split_name[1] });
        else script_doc = await advanced_get_public_script(script_name);
        if (!script_doc) throw new Error('No script available under the name ' + script_name);
        return script_doc
    }
    switch (command) {
        case 'info':
            {
                if (args.length < 1) {
                    await message.channel.send(`<@${message.author.id}>\nPublic script repository info:\n\nEstimated script count: **${await UserScript.estimatedDocumentCount()}**`);
                } else {
                    const script_doc = await get_script();
                    await message.channel.send(`<@${message.author.id}>\nUser id: **${script_doc.user_id}**\nScript name: **${script_doc.script_name}**\nPublic name: **${script_doc.script_public_name || 'Not available via public name'}**`);
                }
            }
            break;
        case 'export':
            {
                if (args.length < 1) throw new Error('Invalid arguments. Expected 3 or more arguments, got ' + (args.length + 1));
                const script_doc = await get_script();
                await message.channel.send(JSON.stringify(script_doc.ast));
            }
            break;
        // process.env.BAZCAL_API_URL || 'http://bazcal.wykerd.io'
        case 'web':
            {
                if (args.length < 1) throw new Error('Invalid arguments. Expected 3 or more arguments, got ' + (args.length + 1));
                const script_doc = await get_script();
                await message.channel.send('Run your custom bot locally in the browser!\n\n' + (process.env.BAZCAL_API_URL || 'http://bazcal.wykerd.io') + '/bot/' + script_doc._id);
            }
            break;
        case 'source':
            {
                if (args.length < 1) throw new Error('Invalid arguments. Expected 3 or more arguments, got ' + (args.length + 1));
                const script_doc = await get_script();
                await message.channel.send('```' + script_doc.script_raw + '```');
            }
            break;
        case 'help':
            return AdvancedPublicHelp(message);
        default:
            throw new Error('Unknown command.');
            break;
    }
}

const advanced_run_public = async (message, name, args) => {
    const script_doc = await advanced_get_public_script(name);
    if (!script_doc) throw new Error('No script available under the name ' + name);
    return advanced_runner(message, script_doc.ast, args);
}

const advanced_get_public_script = name => UserScript.findOne({ script_public_name: name });

const advanced_set_global_name = async (message, name, globName) => {
    if (name.length < 3) throw new Error('Script name too short');
    if (await advanced_get_public_script(globName)) throw new Error('There is already a public script with the name: ' + globName);
    const split_name = name.split('/');
    let script_doc;
    if (split_name.length === 2) script_doc = await UserScript.findOne({ user_id: split_name[0], script_name: split_name[1] });
    else script_doc = await UserScript.findOne({ user_id: message.author.id, script_name: name });
    if (!script_doc) throw Error('No script found with the name ' + name);
    if (script_doc.user_id !== message.author.id) throw new Error('You do own this script!');
    script_doc.script_public_name = globName;
    await script_doc.save();
    message.channel.send(`<@${message.author.id}> Success! Your script is now available publically under the name **${globName}**`);
}

const advanced_delete_script = async (message, name) => {
    const split_name = name.split('/');
    let script_doc;
    if (split_name.length === 2) script_doc = await UserScript.findOne({ user_id: split_name[0], script_name: split_name[1] });
    else script_doc = await UserScript.findOne({ user_id: message.author.id, script_name: name });
    if (!script_doc) throw Error('No script found with the name ' + name);
    if (script_doc.user_id !== message.author.id) throw new Error('You do own this script!');
    await script_doc.remove();
    message.channel.send(`<@${message.author.id}> Success! Your script has been deleted.`);
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const advanced_parse_check = (message, args) => {
    const [ script ] = advanced_parse_args(args);
    const ast = advanced_parse(script);
    if (ast.length > 0) message.channel.send(`<@${message.author.id}> Successfully parsed script!`);
    else message.channel.send(`<@${message.author.id}> Script was parsed but returned an empty AST!`);
}

/**
 * @param {*} args 
 */
const advanced_parse = (script) => {
    // intialize the interpreter
    const in_stream = new InputStream(script);
    const tok_stream = new TokenStream(in_stream);
    const parser = new Parser(tok_stream);
    const ast = parser.parse();
    return ast;
}

const advanced_parse_args = (args) => {
    const args_str = args.join(" ").trim() // recreate the string of the arguments
    if (args_str.indexOf('```') !== 0) throw new Error('Expected \`\`\` to introduce script got ' + args_str.substr(0,3) + '!');
    const [ _, script, new_args_str ] = args_str.split('```');
    return [ script.trim(), new_args_str.trim().split(' ') ];
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const advanced_export = (message, args) => {
    const [ script ] = advanced_parse_args(args);
    return message.channel.send(JSON.stringify(advanced_parse(script)));
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const advanced_save = async (message, name, args) => {
    if (name.length < 3) throw new Error('Script name too short');
    const [ script, new_args ] = advanced_parse_args(args);
    const ast = advanced_parse(script);
    let script_doc = await UserScript.findOne({ user_id: message.author.id, script_name: name });
    if (!script_doc) script_doc = new UserScript({
        user_id: message.author.id, 
        script_name: name,
        script_raw: script,
        ast
    });
    else {
        script_doc.script_raw = script;
        script_doc.ast = ast;
    };
    await script_doc.save();
    message.channel.send(`<@${message.author.id}> Success! Your script is saved under the name **${name}**, other users can access it via the name **${message.author.id}/${name}**. _Scripts are saved globally so you can use them on any server._`);
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const advanced_run = async (message, name, args) => {
    const split_name = name.split('/');
    let script_doc;
    if (split_name.length === 2) script_doc = await UserScript.findOne({ user_id: split_name[0], script_name: split_name[1] });
    else script_doc = await UserScript.findOne({ user_id: message.author.id, script_name: name });
    if (!script_doc) throw Error('No script found with the name ' + name);
    return advanced_runner(message, script_doc.ast, args);
}

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
const advanced_eval = (message, args) => {
    const [ script, new_args ] = advanced_parse_args(args);
    const ast = advanced_parse(script);
    return advanced_runner(message, ast, new_args);
}

/**
 * @param {import('discord.js').Message} message 
 * @param {import('../../lib').ASTNode[]} ast
 * @param {*} args 
 */
const advanced_runner = async (message, ast, args) => {
    // intialize the runtime environment
    const env = new Environment();
    // define global builtin functions
    // Discord API
    const bscript_config = message._server_doc.bscipt; // well this spelling mistake's gonna be here forever
    let messages_sent = 0;
    async function get_priv_chan_intern () {
        const member = await get_member(message);
        const channel = await get_user_channel(message, member);
        member.last_message = new Date();
        member.channel_id = channel.id;
        await member.save();
        return channel;
    };

    env.def("get_private_channel", get_priv_chan_intern);

    if (!bscript_config.force_channel_messages) {
        env.def("get_current_channel", async function () {
            return message.channel;
        });
    } else {
        env.def("get_current_channel", get_priv_chan_intern);
    }

    env.def("send_message", async function (msg, channel) {
        try {
            if (messages_sent === 5) message.channel.send(`<@${message.author.id}> Maximum send_message call limit reached`);
            messages_sent++;
            if (messages_sent > 5) return;
            await (await channel).send(('' + msg).replace(/<@/g, '\\<\\@'));
        } catch (error) {
            message.channel.send(`<@${message.author.id}> Error: Runtime error: send_message threw error: ${error.message}`);
        }
    });
    // Bazcal API
    env.def("advise", advise);
    env.def("default_advise_formatter", function (array) {
        return array.map((item, i) => `${i + 1}: **${item_name(item.name)}**\nQuantity: **${item.evolume}**\nInvested: **${formatNumber(item.invested)}** _(${item.pinvested}%)_\nEstimated Profit: **${formatNumber(item.eprofit)}** _(${item.pprofit}%)_\nSell price trend: **${item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing'}**`).join('\n\n');
    });
    env.def("raw_advise", raw_advise);
    env.def("item_name", item_name);
    // Object builtins
    env.def("get_property", function (obj, prop) {
        if (prop == 'prototype') throw new Error('Runtime error: Getting prototype property is not allowed!');
        return obj[prop];
    });
    env.def("typeof", obj => typeof obj);
    // Array builtins
    env.def("len", function (obj) {
        return obj.length;
    });
    env.def("map", function (array, map_func) {
        if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in map, expected 2 or more got ' + arguments.length);
        return array.map((item, i) => map_func.apply(null, [item, i]));
    });
    env.def("join", function (array, join) {
        if (arguments.length < 1) throw new Error('Runtime error: Invalid amount of arguments in join, expected 1 or more got ' + arguments.length);
        return array.join(join);
    });
    env.def("sort", function (arr, sort_func) {
        if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in sort, expected 2 or more got ' + arguments.length);
        return arr.sort((a, b) => sort_func.apply(null, [a, b]));
    });
    env.def("filter", function (arr, filter_func) {
        if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in filter, expected 2 or more got ' + arguments.length);
        return arr.filter((item, i) => filter_func.apply(null, [item, i]));
    });
    env.def("slice", function (arr, start, end) {
        if (arguments.length < 1) throw new Error('Runtime error: Invalid amount of arguments in join, expected 1 or more got ' + arguments.length);
        return arr.slice(start, end);
    });
    // Number builtins
    env.def("parse_num", function (str) {
        return /\d[A-z]/.test(str) ? convertNumber(str) : parseFloat(str)
    });
    // Runtime builtins
    env.def("arguments", args);
    // linker
    const loader = async (name) => {
        const split_name = name.split('/');
        let script_doc;
        if (split_name.length === 2) script_doc = await UserScript.findOne({ user_id: split_name[0], script_name: split_name[1] });
        else script_doc = await UserScript.findOne({ script_public_name: name });
        if (!script_doc) throw Error('No script found with the name ' + name);
        return await StaticallyLink(script_doc.ast, loader);
    };
    
    const bin = await StaticallyLink(ast, loader);
    // evaluate the ast output from the parser or saved in the db
    env.evaluate({
        type: "sequence",
        seq: ast
    });
}

export default handler;