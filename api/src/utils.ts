import { CacheDocument } from "./models/cache"

export interface ItemLookupResult {
    name: string;
    buy: number;
    sell: number;
    volume: number;
    svolume?: number;
}

export interface ItemProfitResult {
    name: string,
    buy: number, sell: number,
    volume: number, svolume: number, evolume: number,
    profit: number, pprofit: number, oprofit: number
}

export interface ProfitSplitResult {
    profit_array: ItemProfitResult[],
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
                volume: typeof volume === 'number' ? volume : -1
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
            volume: typeof volume === 'number' ? volume : -1,
            svolume: typeof svolume === 'number' ? svolume : -1
        };
        dataset.push(item);
    }

    return dataset;
}

function limit(val : number, min : number, max : number) {
    return val < min ? min : (val > max ? max : val)
}

export function profit_calculation(balance: number, dataset: ItemLookupResult[], time: number) : ProfitSplitResult {
    if (Number.isNaN(balance) || Number.isNaN(time)) return undefined;
    
    const profit_array : ItemProfitResult[] = []
    for (const item of dataset) {
        const profit = item.sell - item.buy
        const profit_percent = profit / item.buy

        const t_volume_ph = (Math.min(item.volume, item?.svolume ?? 0) / 10080) * time
        const eff_volume_ph = Math.floor(limit(t_volume_ph, 0, balance / item.buy))

        const order_profit = Math.round(profit * eff_volume_ph)

        profit_array.push({
            name: item.name,
            buy: item.buy, sell: item.sell,
            volume: item.volume, svolume: item.svolume, evolume: eff_volume_ph,
            profit: profit, pprofit: profit_percent, oprofit: order_profit
        })

        profit_array.sort(function (a, b) {
            return b.oprofit - a.oprofit
        })
    }

    return { profit_array: profit_array.slice(0, 6) }
}

interface VolitilityStats {
    mean: number;
    std: number;
}

interface VolitilityInfo {
    buy: VolitilityStats, 
    sell: VolitilityStats, 
    volume: VolitilityStats, 
    svolume: VolitilityStats,
    count: number
}

interface VolitilityDataMap {
    count: number
    buy: [number,number], 
    sell: [number,number], 
    volume: [number,number], 
    svolume: [number,number]
}

export function volitility_calc (docs : CacheDocument[]) : { [key: string]: VolitilityInfo } {
    const sorted : { [key: string]: VolitilityDataMap } = {};
    docs.forEach(doc => {
        for (const product in (doc.response?.products ?? {})) {
            if (doc.response?.products?.hasOwnProperty(product)) {
                const buy : number = parseFloat(doc.response?.products[product]?.sell_summary?.[0]?.pricePerUnit);
                const sell : number = parseFloat(doc.response?.products[product]?.buy_summary?.[0]?.pricePerUnit);
                const volume : number = parseFloat(doc.response?.products[product]?.['quick_status']?.['buyMovingWeek']);
                const svolume : number = parseFloat(doc.response?.products[product]?.['quick_status']?.['sellMovingWeek']);
                
                if (!sorted[product]) sorted[product] = { buy: [0,0], sell: [0,0], volume: [0,0], svolume: [0,0], count: 0 };

                sorted[product].count++;
                sorted[product].buy[0] += buy;
                sorted[product].sell[0] += sell;
                sorted[product].svolume[0] += svolume;
                sorted[product].volume[0] += volume;
                sorted[product].buy[1] += buy * buy;
                sorted[product].sell[1] += sell * sell;
                sorted[product].svolume[1] += svolume * svolume;
                sorted[product].volume[1] += volume * volume;
            }
        }
    });

    const ret : { [key: string]: VolitilityInfo } = {}; 

    Object.keys(sorted).forEach(key => {
        const item = sorted[key];
        const n = item.count;

        const std_calc = (num : [number,number]) => Math.sqrt((num[1]/n)-((num[0] / n) * (num[0] / n)))

        ret[key] = {
            buy: {
                mean: item.buy[0] / n,
                std: std_calc(item.buy)
            },
            sell: {
                mean: item.sell[0] / n,
                std: std_calc(item.sell)
            },
            svolume: {
                mean: item.svolume[0] / n,
                std: std_calc(item.svolume)
            },
            volume: {
                mean: item.volume[0] / n,
                std: std_calc(item.volume)
            },
            count: n
        }
    });

    return ret;
}
