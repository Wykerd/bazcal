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
import { Client } from 'discord.js'
import { CommandParser, DiscordBot } from '@wykerd/discord-framework'
import SubscribeHandler from './handlers/subscribe'
import TradeHandler, { TradeConverseAdapter } from './handlers/notif'
import { resolve } from 'path'
import { convertNumber } from './utils'

export const client = new Client()

const parser = new CommandParser('!bz')

parser.nlp.must_include = ['bazcal', 'baz', ' bz '];

const bot = new DiscordBot(parser, client)

// bot.use('sub', SubscribeHandler, [])
bot.use('notif', TradeHandler, [amount => /\d[A-z]/.test(amount) ? convertNumber(amount) : amount ])

bot.converse('bazcal.notif', TradeConverseAdapter);

bot.model(resolve(__dirname, './model.nlp'))

client.login(process.env.DISCORD_KEY)

export default bot