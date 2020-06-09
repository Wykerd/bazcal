export function advise(input, filter, balance) {
    const mapped_input = input['products'].map(function (product) {
        return product['id'] == 'ENCHANTED_CARROT_ON_A_STICK' ? undefined : {
            'name': product['id'],
            'buy': product['sell_summary'][0]['pricePerUnit'],
            'sell': product['buy_summary'][0]['pricePerUnit'],
            'volume': product['quick_status']['buyMovingWeek'],
            'svolume': product['quick_status']['sellMovingWeek']
        }
    })

    const sorted_input = []
    for (const product of mapped_input) {
        const profit = product.sell - product.buy

        const tvolume = Math.min(product.volume, product.svolume) / 2016
        const evolume = Math.round((tvolume > 0 ? (tvolume < balance ? tvolume : balance) : 0) * 10) / 10

        const eprofit = Math.round((evolume * profit) * 10) / 10

        sorted_input.push({
            'name': product.name,
            'evolume': evolume,
            'invested': Math.round((product.buy * evolume) * 10) / 10,
            'pinvested': (product.buy * evolume) / balance,
            'eprofit': eprofit,
            'pprofit': profit / product.buy
        })

    }
    sorted_input.sort((a, b) => {
        return b.eprofit - a.eprofit
    })

    // FILTER WITH BUY / SELL
    
}