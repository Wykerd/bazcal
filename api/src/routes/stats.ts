import express from "express";
import APICache from '../models/cache';
import createError from "http-errors";
import fs from 'fs';
import path from 'path';

export const StatsCalc : express.RequestHandler = async (_req, res, next) => {
    try {
        const f_path = path.resolve(process.env.DATA_DIR ?? './', 'stats.json');
        res.status(200).json(await fs.promises.readFile(f_path));
    } catch (error) {
        console.error(error);
        next(createError(500, 'Internal API error.')); // just catch all, I'm to lazy to check for each type...
    }
}