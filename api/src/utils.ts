export interface ItemLookupResult {
    name: string;
    buy: number;
    sell: number;
    buy_volume: number;
    sell_volume?: number;
}

export interface ItemProfitResult {
    name: string,
    buy_price: number,
    profit: number,
    effective_volume: number,
    profit_percent: number,
}

export interface ProfitSplitResult {
    profit_array: ItemProfitResult[],
    splits: number
}

export function search(product_id: string, products: any) : ItemLookupResult | undefined {
    if (!products) return undefined;

    for (const product in products) {
        if (product === product_id) {
            const buy : any = products[product]?.sell_summary?.[0]?.pricePerUnit;
            const sell : any = products[product]?.buy_summary?.[0]?.pricePerUnit;
            const volume : any = products[product]?.['quick_status']?.['buyMovingWeek'];
            const item = {
                name: product_id,
                buy: typeof buy === 'number' ? buy : -1,
                sell: typeof sell === 'number' ? sell : -1,
                buy_volume: typeof volume === 'number' ? volume : -1
            };
            return item;
        }
    }
    return undefined;
}

export function fill_dataset (products: any) : ItemLookupResult[] {
    if (!products) return [];

    const dataset : ItemLookupResult[] = [];

    for (const product in products) {
        const buy : any = products[product]?.sell_summary?.[0]?.pricePerUnit;
        const sell : any = products[product]?.buy_summary?.[0]?.pricePerUnit;
        const volume : any = products[product]?.['quick_status']?.['buyMovingWeek'];
        const svolume : any = products[product]?.['quick_status']?.['sellMovingWeek'];
        const item = {
            name: product,
            buy: typeof buy === 'number' ? buy + 0.1 : -1,
            sell: typeof sell === 'number' ? sell + 0.1 : -1,
            buy_volume: typeof volume === 'number' ? volume : -1,
            sell_volume: typeof svolume === 'number' ? svolume : -1
        };
        dataset.push(item);
    }

    return dataset;
}

function limit(val : number, min : number, max : number) {
    return val < min ? min : (val > max ? max : val)
}

function profit_calculation(balance: number, splits: number, dataset: ItemLookupResult[], time: number) : ProfitSplitResult {
    var split_bal = balance / splits
    var profit_array : ItemProfitResult[] = []
    for (var item of dataset) {
        var profit_per = item.sell - item.buy
        var profit_percent = profit_per / item.buy

        var t_volume_ph = (Math.min(item.buy_volume, item?.sell_volume ?? 0) / 10080) * time
        var eff_volume_ph = Math.floor(limit(t_volume_ph, 0, split_bal / item.buy))

        var order_profit = Math.round(profit_per * eff_volume_ph)

        profit_array.push({
            name: item.name,
            buy_price: item.buy,
            profit: order_profit,
            effective_volume: eff_volume_ph,
            profit_percent: profit_percent,
        })

        profit_array.sort(function (a, b) {
            return b.profit - a.profit
        })
    }

    return {
        splits,
        profit_array
    }
}

function sum(input: any[], splits: number) {
    var total = 0
    for (var i = 0; i < splits; i++) {
        total += Number(input[i].Profit)
    }
    return total
}

export function profit_split(balance : number, dataset : ItemLookupResult[], time : number) : ProfitSplitResult | undefined {
    if (Number.isNaN(balance) || Number.isNaN(time)) return undefined;

    let most_profit_split : ProfitSplitResult | undefined;
    for (var i = 1; i < 7; i++) {
        var splitobj = profit_calculation(balance, i, dataset, time)
        if (!most_profit_split) {
            most_profit_split = splitobj
        } else if (sum(splitobj.profit_array, i) > sum(most_profit_split.profit_array, i)) {
            most_profit_split = splitobj
        }
    }
    if (!most_profit_split) return undefined;
    return { splits: most_profit_split.splits, profit_array: most_profit_split.profit_array.splice(0, 6) };
}