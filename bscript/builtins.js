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
const _0={};

_0.get_property = function (obj, prop) {
    return obj[prop];
};

_0.typeof = function (obj) {
    return typeof(obj);
}

_0.len = function (obj) {
    return obj.length;
}

_0.map = function (array, map_func) {
    if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in map, expected 2 or more got ' + arguments.length);
    return array.map(function (item, i) { return map_func.apply(null, [item, i]) });
}

_0.join = function (array, join) {
    if (arguments.length < 1) throw new Error('Runtime error: Invalid amount of arguments in join, expected 1 or more got ' + arguments.length);
    return array.join(join);
}

_0.sort = function (arr, sort_func) {
    if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in sort, expected 2 or more got ' + arguments.length);
    return arr.sort(function (a, b) { return sort_func.apply(null, [a, b]) });
}

_0.filter = function (arr, filter_func) {
    if (arguments.length < 2) throw new Error('Runtime error: Invalid amount of arguments in filter, expected 2 or more got ' + arguments.length);
    return arr.filter(function (item, i) { return filter_func.apply(null, [item, i]) });
}

_0.slice = function (arr, start, end) {
    if (arguments.length < 1) throw new Error('Runtime error: Invalid amount of arguments in join, expected 1 or more got ' + arguments.length);
    return arr.slice(start, end);
};

_0.parse_num = function (str) {
    return /\d[A-z]/.test(str) ? (function () {
        var exp = /[A-z]+/.exec(input)
        var num = /[+-]?([0-9]*[.])?[0-9]+/.exec(input)
    
        if (exp[0].toUpperCase() == 'M' || exp[0].toUpperCase() == 'MIL') {
            return num[0] * 1000000
        } else if (exp[0].toUpperCase() == 'K') {
            return num[0] * 1000
        }
        
        return false;
    })() : parseFloat(str)
}

export default _0