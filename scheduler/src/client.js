import { Client } from 'discord.js'
import { CommandParser, DiscordBot } from '@wykerd/discord-framework'
import SubscribeHandler from './handlers/subscribe'
import TradeHandler from './handlers/notif'

export const client = new Client()

const parser = new CommandParser('!bz')

const bot = new DiscordBot(parser, client)

bot.use('sub', SubscribeHandler, [])
bot.use('notif', TradeHandler, ['number'])

client.login('NTE4NDcyMjM2NjQyOTkyMTI4.Xt-KVw.juFJYqqKJZH_DTUgxgv9WFMzV0U')

export default bot