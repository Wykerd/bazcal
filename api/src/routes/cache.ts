import express from "express";
import APICache from '../models/cache';
import createError from "http-errors";

export const CachedResponse : express.RequestHandler = async (_req, res, next) => {
    try {
        const api_res = await APICache.findOne().sort({ timestamp: -1 }).exec(); // get latest result

        if (!api_res) return next(createError(404, 'Could not find cached response'));

        res.status(200).json({ ...api_res.response, _timestamp: api_res.timestamp.toISOString() });
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}