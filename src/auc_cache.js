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
import fetch from 'node-fetch';
import fs from 'fs';

let auction_cache = [];

const sorted_flips = [];

async function populate (page) {
    console.log(page);
    let json;
    try {
        const api_res = await fetch(`https://api.hypixel.net/skyblock/auctions?key=${process.env.API_KEY}&page=${page}`);
        json = await api_res.json();   
    } catch (error) {
        // retry the whole loop
        auction_cache = [];
        return await populate(0);
    }

    auction_cache = [...auction_cache, ...json.auctions];

    if (page < json.totalPages - 1) {
        return await populate(page+1);
    }
}

let time_start = Date.now();

export async function cache_flip () {
    time_start = Date.now();

    auction_cache = [];

    await populate(0);
    await fs.promises.writeFile('cache.json', JSON.stringify(auction_cache, null, '  '));

    const groups = {};
    
    auction_cache.forEach(item => {
        if (!groups[item.extra]) {
            groups[item.extra] = [ item ];
            return;
        } 

        groups[item.extra].push(item);
    });

    const gaps = [];

    for (const item in groups) {
        groups[item] = groups[item].sort((a, b) => (a.highest_bid_amount || a.starting_bid) - (b.highest_bid_amount || b.starting_bid));

        const median_item = groups[item][Math.floor(groups[item].length / 2)];

        const median = (median_item.highest_bid_amount || median_item.starting_bid)

        const lowest_price = groups[item][0].highest_bid_amount || groups[item][0].starting_bid;

        const bid_price = groups[item][0].highest_bid_amount ? lowest_price * 1.15 : lowest_price;

        const profit_gap = median - bid_price;

        gaps.push([groups[item].filter(it => (it.highest_bid_amount || it.starting_bid) === lowest_price), profit_gap, bid_price]);
    }

    sorted_flips.splice(0, sorted_flips.length, ...gaps.sort((a,b) => b[1] - a[1]));

    const time_left = 60000 - (Date.now() - time_start);

    setTimeout(async () => {
        try {
            await cache_flip();
        } catch (error) {
            console.error(error);
        }
    }, time_left > 0 ? time_left : 1);
};

export default sorted_flips;