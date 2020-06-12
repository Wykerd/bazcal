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

bot.use('sub', SubscribeHandler, [])
bot.use('notif', TradeHandler, [amount => /\d[A-z]/.test(amount) ? convertNumber(amount) : amount ])

bot.converse('bazcal.notif', TradeConverseAdapter);

bot.model(resolve(__dirname, './model.nlp'))

client.login('NTE4NDcyMjM2NjQyOTkyMTI4.XuJgbw.LLRRo1GJGbcqt_1YxBZ8WPz0LAc')

export default bot