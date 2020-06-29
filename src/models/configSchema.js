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
import mongoose from 'mongoose'

/*
item_index
item_id
item_name
quantity
invested
invested_short
invested_percentage
estimated_profit_short
estimated_profit_percentage
sell_trend
buy_trend
*/

const configSchema = new mongoose.Schema({
    category_id: {
        type: String,
        required: true
    },
    server_id: {
        type: String,
        required: true
    },
    advice_defaults: {
        timeframe: {
            type: Number,
            default: 15
        },
        include_stablity: {
            type: Boolean,
            default: false
        }
    },
    results: {
        type: Number,
        default: 6,
        min: 1,
        max: 10
    },
    message_templates: {
        advice: {
            header: {
                type: String,
                default: 'Advice for {{balance}}\n\n'
            },
            instruction: {
                type: String,
                default: '{{user}} I\'ve sent you advice in your channel'
            },
            format: {
                type: String,
                default: `{{item_index}}: **{{item_name}}**\nQuantity: **{{quantity}}**\nInvested: **{{invested_short}}** _({{invest_percentage}}%)_\nEstimated Profit: **{{estimated_profit_short}}** _({{estimated_profit_percentage}}%)_\nSell price trend: **{{sell_trend}}**`
            }
        },
        notif: {
            header: {
                type: String,
                default: '**Instructions: Pick items from the list and place buy orders for them with the listed quantities, then hold on to these items until the bot notifies you of the optimal time to sell them**\n\n'
            },
            no_results: {
                type: String,
                default: 'Looks like the market is in flames...'
            },
            footer: {
                type: String,
                default: '_This data is updated every 30 seconds_\n\nYou have 60 seconds to respond\n\n**React with the numbers of the orders you wish to be notified of when to sell then confirm with :thumbsup:...**'
            },
            instruction: {
                type: String,
                default: '{{user}} Check your DMs'
            },
            pending: {
                type: String,
                default: 'You already have other investments pending, react with :thumbsup: to add these to the exiting investments or with :thumbsdown: to remove the old investments?'
            },
            confirmed: {
                type: String,
                default: 'Great! I\'ll notify you when you need to sell your investments.'
            }
        }
    },
    bscipt: {
        force_channel_messages: {
            type: Boolean,
            default: false
        },
        send_message_limit: {
            type: Number,
            default: 5
        }
    }
})

export default mongoose.model('ServerConfig', configSchema)