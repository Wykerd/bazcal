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

 // Imports all the nessasary libraries
import { Client } from 'discord.js'
import { CommandParser, DiscordBot } from '@wykerd/discord-framework'
import { convertNumber } from './utils'

// Imports all the command handlers (functions)
import TradeHandler from './handlers/notif'
import { HelpHandler, LicenseHandler, InviteHandler, SupportHandler } from './handlers/info'
import { ConfigHandler, ConfigLoader, ConfigGenerator } from './handlers/config'
import AdviseHandler from './handlers/advise'
import LookupHandler from './handlers/lookup'
import AuctionFlipHandler from './handlers/ahflip'

// Initailize the bot's variables and parsers
export const client = new Client()

const parser = new CommandParser('!bz')

const bot = new DiscordBot(parser, client)

// Define all the bot's commands and make it possible to use them
bot.use(['notif', 'notify', 'advise', 'advice', 'config', 'configure', 'conf', 'ahflip', 'ahf', 'af'], ConfigLoader, []);

bot.use(['notif', 'notify', 'n'], TradeHandler, [amount => /\d[A-z]/.test(amount) ? convertNumber(amount) : parseFloat(amount)])

bot.use(['advise', 'advice', 'a'], AdviseHandler, [amount => /\d[A-z]/.test(amount) ? convertNumber(amount) : parseFloat(amount)])

bot.use(['help', '?'], HelpHandler, [])

bot.use(['license', 'about'], LicenseHandler, [])

bot.use(['lookup', 'search', 'item'], LookupHandler, ['string']);

bot.use(['ahflip', 'ahf', 'af'], AuctionFlipHandler, [amount => /\d[A-z]/.test(amount) ? convertNumber(amount) : parseFloat(amount)]);

bot.use(['config', 'configure', 'conf'], ConfigHandler,['string']);

bot.use(['init', 'setup'], ConfigGenerator, []);

bot.use(['invite', 'i'], InviteHandler, []);

bot.use(['support', 'sup', 'server'], SupportHandler, []);

// Fetches the discord bot key from the docker-compose file
client.login(process.env.DISCORD_KEY)

export default bot