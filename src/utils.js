const items = require('../items.json');

export function item_name (item_id) {
    return items[item_id]?.name ?? item_id.replace('_', ' ');
}