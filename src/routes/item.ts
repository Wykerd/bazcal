import express from "express";
import fetch from "node-fetch";
import createError from "http-errors";
import { search } from "../utils";

export const ItemLookup : express.RequestHandler = async (req, res, next) => {
    try {
        const json = await (await fetch(`${process.env.API_ENDPOINT}?key=${process.env.API_KEY}`)).json();
        const item = search(req.params.id, json?.products);
        if (!item) return next(createError(404, 'Not found.'));
        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}