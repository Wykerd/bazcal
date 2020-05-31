import express from "express";
import APICache from '../models/cache';
import createError from "http-errors";
import { search } from "../utils";

export const ItemLookup : express.RequestHandler = async (req, res, next) => {
    try {
        const api_res = await APICache.findOne().sort({ timestamp: 1 }).exec();

        if (!api_res) return next(createError(404, 'Could not find cached response'));

        const item = search(req.params.id, api_res.response?.products);

        if (!item) return next(createError(404, 'Not found.'));
        res.status(200).json({ ...item, _timestamp: api_res.timestamp.toISOString() });
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}