import express from "express";
import fetch from "node-fetch";
import createError from "http-errors";
import { search } from "../utils";

export const ItemLookup : express.RequestHandler = async (req, res, next) => {
    try {
        const api_res = await fetch(`${process.env.API_ENDPOINT}?key=${req.body._user.api_key}`);
        const json = await api_res.json();

        if (api_res.status !== 200) {
            return res.status(500).json({
                message: 'Hypixel API error',
                error: json
            });
        }

        const item = search(req.params.id, json?.products);
        if (!item) return next(createError(404, 'Not found.'));
        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}