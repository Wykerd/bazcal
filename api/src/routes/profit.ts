import express from "express";
import APICache from '../models/cache';
import createError from "http-errors";
import { fill_dataset, profit_split } from "../utils";

export const ProfitLookup : express.RequestHandler = async (req, res, next) => {
    try {
        const api_res = await APICache.findOne().sort({ timestamp: 1 }).exec();

        if (!api_res) return next(createError(404, 'Could not find cached response.'));
        
        const dataset = fill_dataset(api_res.response?.products);
        
        if (dataset.length === 0) return next(createError(404, 'Nothing found.'));
        const split = profit_split(parseInt(req.params.bal), dataset, parseInt(req.params.timeframe));

        if (!split) return next(createError(500, 'Could not calculate profit_split'));
        res.status(200).json({ ...split, _timestamp: api_res.timestamp.toISOString() });
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}