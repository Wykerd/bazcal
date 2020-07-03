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

/** Micro cache.js */

import _0 from './builtins';
import save_cache from './bz_cache_web';

const k = 2 / (window.config.RANGE + 1);

const timer = setInterval(async function () {
    try {
        console.log('Caching response');

        const api_res = await fetch(`${window.config.API_ENDPOINT}?key=${window.config.API_KEY}`);
        
        const json = await api_res.json();

        const items = Object.keys(json['products']).map(function (key) {
            return {
                'name': json['products'][key]['product_id'],
                'buy': json['products'][key]?.['sell_summary']?.[0]?.['pricePerUnit'] + 0.1 ?? -1,
                'sell': json['products'][key]?.['buy_summary']?.[0]?.['pricePerUnit'] - 0.1 ?? -1,
                'volume': json['products'][key]?.['quick_status']?.['buyMovingWeek'] ?? -1,
                'svolume': json['products'][key]?.['quick_status']?.['sellMovingWeek'] ?? -1
            }
        });

        const buy_point = [];
        const sell_point = [];

        for (const item of items) {
            if (item.name === "ENCHANTED_CARROT_ON_A_STICK") continue;

            if (!_0.item_cache[item.name]) {
                _0.item_cache[item.name] = {
                    buy: item.buy,
                    sell: item.sell,
                    volume: item.volume,
                    svolume: item.svolume,
                    buy_ema: item.buy,
                    sell_ema: item.sell
                }
            } else {
                const pre_b_ema = _0.item_cache[item.name].buy_ema;
                const pre_s_ema = _0.item_cache[item.name].sell_ema;
                const pre_b = _0.item_cache[item.name].buy;
                const pre_s = _0.item_cache[item.name].sell;

                _0.item_cache[item.name].buy = item.buy;
                _0.item_cache[item.name].sell = item.sell;
                _0.item_cache[item.name].volume = item.volume;
                _0.item_cache[item.name].svolume = item.svolume;
                _0.item_cache[item.name].buy_ema = item.buy * k + pre_b_ema * (1 - k);
                _0.item_cache[item.name].sell_ema = item.sell * k + pre_s_ema * (1 - k);

                if ((pre_b <= pre_b_ema) && (item.buy > _0.item_cache[item.name].buy_ema)) buy_point.push(item.name);
                if ((pre_s >= pre_s_ema) && (item.sell < _0.item_cache[item.name].sell_ema)) sell_point.push(item.name);
            }
        }

        _0.cache_hook(buy_point, sell_point);

        await save_cache();
    } catch (error) {
        console.error('Caching error', error);
    }
}, 30000);

_0.kill_scheduler = function () {
    clearInterval(timer);
    return false;
}

/** Micro utils.js */

_0.advise = function (balance, count = 6, time = 5, include_stablity = true) {
    const unsorted = _0.raw_advise(balance, time, include_stablity);

    const sorted = unsorted.sort((a, b) => {
        return b.eprofit - a.eprofit
    })

    if (include_stablity) return sorted.filter(item => (_0.item_cache[item.name].buy > _0.item_cache[item.name].buy_ema) && (_0.item_cache[item.name].sell > _0.item_cache[item.name].sell_ema)).slice(0, count)
    
    return sorted.slice(0, count);
}

_0.raw_advise = function (balance, time = 5, include_stablity = true) {
    function limit(val, min, max) {
        return val < min ? min : (val > max ? max : val)
    }

    const unsorted = []
    for (const product_name in _0.item_cache) {
        const product = _0.item_cache[product_name]
        const profit = (product.sell * 0.99) - product.buy

        const tvolume = (Math.min(product.volume, product.svolume) / 10080) * time
        const evolume = Math.floor(limit(tvolume, 0, balance / product.buy))

        const eprofit = (evolume * profit)

        unsorted.push({
            'name': product_name,
            'evolume': evolume,
            'invested': (product.buy * evolume),
            'pinvested': (((product.buy * evolume) * 100) / balance).toFixed(1),
            'eprofit': eprofit,
            'pprofit': ((profit / product.buy) * 100).toFixed(1),
            'gradient': product.sell - product.sell_ema
        })
    }
    return unsorted;
}

const formatter = new Intl.NumberFormat()

_0.format_number = function (number) {
    if (number >= 1000000) {
        return formatter.format(_0.round(number / 1000000, 2)) + 'M'
    } else if (number >= 1000) {
        return formatter.format(_0.round(number / 1000, 2)) + 'K'
    } else {
        return _0.round(number, 2)
    }
}

_0.round = function (value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}

_0.default_advise_formatter = function (array) {
    return array.map((item, i) => `${i + 1}: **${_0.item_name(item.name)}**\nQuantity: **${item.evolume}**\nInvested: **${_0.format_number(item.invested)}** _(${item.pinvested}%)_\nEstimated Profit: **${_0.format_number(item.eprofit)}** _(${item.pprofit}%)_\nSell price trend: **${item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing'}**`).join('\n\n');
}

_0.item_name = function (item_id) {
    return _0.items[item_id] ?? item_id.replace('_', ' ');
}