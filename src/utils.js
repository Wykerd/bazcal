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
const items = require('../items.json');

export function item_name (item_id) {
    return items[item_id]?.name ?? item_id.replace('_', ' ');
}

export function convertNumber(input) {
    let exp = /[A-z]+/.exec(input)
    let num = /[+-]?([0-9]*[.])?[0-9]+/.exec(input)

    if (exp[0].toUpperCase() == 'M' || exp[0].toUpperCase() == 'MIL') {
        return num[0] * 1000000
    } else if (exp[0].toUpperCase() == 'K') {
        return num[0] * 1000
    }
}

const formatter = new Intl.NumberFormat()

export function formatNumber(number) {
    if (number >= 1000000) {
        return formatter.format(round(number / 1000000, 2)) + 'M'
    } else if (number >= 1000) {
        return formatter.format(round(number / 1000, 2)) + 'K'
    } else {
        return round(number, 2)
    }
}

export function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}
