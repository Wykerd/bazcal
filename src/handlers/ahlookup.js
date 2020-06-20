const fetch = require('node-fetch')

const AuctionLookupHandler = async (message, args) => {
    let item_name = args[0].toUpperCase().replace(/ /g, '_')
    let url = 'https://api.slothpixel.me/api/skyblock/auctions/'

    const item_data = await ( await fetch(url + item_name)).json()

    if (!item_data?.average_price) throw new Error('Item with name **' + args[0] + '** not found')

    message.channel.send(`<@${message.author.id}>\nAverage Price: **${item_data.average_price}**\nMedian Price: **${item_data.median_price}**\nStandard Deviation: **${item_data.standard_deviation}**\n\nMax Price: **${item_data.max_price}**\nMinimum Price: **${item_data.min_price}**\n\nItems sold in the last 24h: **${item_data.sold}**`)
}

export default AuctionLookupHandler