import express from "express";
import APICache from '../models/cache';
import createError from "http-errors";
import { volitility_calc } from "../utils";

export const StatsCalc : express.RequestHandler = async (_req, res, next) => {
    try {
        res.status(200).json(volitility_calc(await APICache.find()));
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}