const { NUMBER_EMOJI } = require('../config.json')
const cache = require('..../data/cache.json')

const handler = async (message, args) => {
    const userID = message.author.id
    const options = 7

    let main = await message.author.send(advise(cache.parse() , args[1]))

    // Setup for the react
    for (let i = 1; i < options + 1; i++) {
        await main.react(NUMBER_EMOJI[i])
    }
    await main.react('👍')

    const filter = (reaction, user) => {
        return NUMBER_EMOJI.includes(reaction.emoji.name) && user.id === userID
    }

    // Asks which orders he would like to invest in
    const reaction_array = []
    async function awaitReaction(message) {
        message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first()

                if (reaction.emoji.name != '👍') {
                    reaction_array.push(NUMBER_EMOJI.indexOf(reaction.emoji.name))
                    awaitReaction(message)
                } else {
                    console.log(reaction_array.sort((a, b) => a - b))
                    console.log('Sign up to sell newsletter')

                    //Converts reaction to orderIDs
                    const orders = []
                    for (i of reaction_array) {
                        orders.append(sorted_input[i - 1])
                    }

                    const member = await UserOrder.findOne({ user_id: message.author.id })

                    if (!member) {
                        // Create a new order for user
                        const n_mem = new UserOrder({
                            user_id: message.author.id,
                            subscribed: false
                            orders: orders
                        })
                        await n_mem.save()
                    } else {
                        //Ask if he wants pervious orders to be updated or cancelled
                        filter = (reaction, user) => {
                            return ['??', '??'].includes(reaction.emoji.name) && user.id === userID

                        message.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then(collected => {
                                const reaction = collected.first()

                                if (reaction.emoji.name != '??') {
                                    // Update Pervious
                                    for (let order of orders) {
                                        if (!member.orders.includes(order.name)) {
                                            member.orders.append(order)
                                        }
                                    }
                                    await member.save()
                                } else {
                                    //Cancel Previous
                                    member.orders = orders
                                    await member.save()

                        await member.save()
                    }
                }
            })
            .catch(error) {
                message.author.send('Failed to sign up, if this was an error, contact player support')
            }
    }
    awaitReaction(main)
}


function advise(mapped_input, balance) {
    const sorted_input = []
    for (const product of mapped_input) {
        const profit = product.sell - product.buy

        const tvolume = Math.min(product.volume, product.svolume) / 2016
        const evolume = Math.round(tvolume > 0 ? (tvolume < balance ? tvolume : balance) : 0)

        const eprofit = (evolume * profit)

        sorted_input.push({
            'name': product.name,
            'evolume': evolume,
            'invested': (product.buy * evolume).toFixed(2),
            'pinvested': ((product.buy * evolume) / balance).toFixed(2),
            'eprofit': eprofit.toFixed(2),
            'pprofit': (profit / product.buy).toFixed(2)
        })

    }

    sorted_input.sort((a, b) => {
        return b.eprofit - a.eprofit
    })

    const order_range = 7
    const final_message = `Best trades with **${balance}** coins:\n\n`

    for (const item of sorted_input) {
        final_message += `Item: **${item.name}** _(${item.evolume})_\n`
        final_message += `Invested: **${item.invested}** _(${item.pinvested}%)_\n`
        final_message += `Profit: **${item.eprofit}** _(${item.pprofit}%)_\n\n`
    }

    return final_message += '_This data is updated every 30 seconds_'
}

export default handler
