import _0 from './builtins';

const pre_cache = window.localStorage.getItem('item_cache');

_0.item_cache = pre_cache ? JSON.parse(pre_cache) : {};

_0.cache_hook = function () {}

export default function save_cache () {
    window.localStorage.setItem('item_cache', JSON.stringify(_0.item_cache));
    return Promise.resolve();
}