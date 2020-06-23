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

/**
 * @param {import('discord.js').Message} message 
 * @param {*} args 
 */
export const HelpHandler = (message, args) => {
    return message.channel.send(`<@${message.author.id}> Bazcal - A Discord bot for bazaar trading.\n\nAll commands start with the \`!bz\` prefix.\n\n\`advise\` (aliasses: advice) Simple flipping command, Params: <amount> <timeframe>\n\n\`notif\` (aliasses: notify) Advanced bazaar trading. The bot tell you what to create buy orders for and notifies you when to create the sell orders for maximum profits. Params: <amount>\n\n\`license\` (aliasses: about) Sends more info regarding the bot\n\n\`lookup\` (aliasses: item, search) Returns info regarding a item. Params: <item_name>\n\n\`ahlookup\` (aliasses: ahl) Return info regarding the item on the auction house. Params: <item_name>\n\n\`advanced\` Command for using custom scripts. See !bz advanced help.`);
}

export const LicenseHandler = (message, args) => {
    return message.channel.send(`<@${message.author.id}> Bazcal - A Discord bot for bazaar trading.\n\nCopyright Daniel Wykerd, Dirk Beukes 2020\n\n\`\`\`\nBazcal is free software: you can redistribute it and/or modify\nit under the terms of the GNU Affero General Public License as published by\nthe Free Software Foundation, either version 3 of the License, or\n(at your option) any later version.\n\nBazcal is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU Affero General Public License for more details.\n\nYou should have received a copy of the GNU Affero General Public License\nalong with Bazcal.  If not, see <https://www.gnu.org/licenses/>.\n\`\`\`\n**NOTE:** This software depends on other packages that may be licensed under different open source licenses.\n\nThe source is freely available on Github here: https://github.com/Wykerd/bazcal`);
}

export const AdvancedHelp = (message) => {
    return message.channel.send(`<@${message.author.id}> Advanced Command Help\n\n\`parse\` Check whether your code parses.\n\n\`export\` returns the parsed AST output returned by the parser [you're probably never gonna use this]\n\n\`eval\` Evaluate a script. How to use: !bz advanced eval \\\`\\\`\\\`# your script\\\`\\\`\\\` <arguments>\n\n\`delete\` Delete one of your saved scripts. Params: <script_name>\n\n\`save\` Save a script to the public repository. How to use: !bz advanced save <name> \\\`\\\`\\\`# your script\\\`\\\`\\\`\n\n\`run\` Run one of your saved scripts. Params: <name> <arguments>\n\n\`set_name\` Set a public name so that anyone can use your script easily. Params <script_name> <public_name>\n\n\`public\` Access the public repository. For more info run !bz advanced public help\n\nFor more information on how to write scripts using BScript visit: https://github.com/Wykerd/bazcal/blob/master/BScript.md`);
}

export const AdvancedPublicHelp  = (message) => {
    return message.channel.send(`<@${message.author.id}> Public Repo Commands Help\n\n\`info\` Get info of script. Params <script_name>\n\n\`export\` returns the parsed AST output returned by the parser [you're probably never gonna use this]. Params: <script_name>\n\n\`source\` Get the source code for a script. Params: <script_name>\n\nRunning public commands: !bz advanced <public_script_name>`);
}