import express from "express";
import fetch from "node-fetch";
import createError from "http-errors";
import { fill_dataset, profit_split } from "../utils";

export const ProfitLookup : express.RequestHandler = async (req, res, next) => {
    try {
        const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${req.body._user.api_key}`);
        const json = await api_res.json();

        if (api_res.status !== 200) {
            return res.status(500).json({
                message: 'Hypixel API error',
                error: json
            });
        }
        
        const dataset = fill_dataset(json?.products);
        if (dataset.length === 0) return next(createError(404, 'Nothing found.'));
        const split = profit_split(parseInt(req.params.bal), dataset, parseInt(req.params.timeframe));
        if (!split) return next(createError(500, 'Could not calculate profit_split'));
        res.status(200).json(split);
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}