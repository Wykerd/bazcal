import jwt from 'jsonwebtoken'
import fs from 'fs'
import { RequestHandler } from 'express'
import createHttpError from 'http-errors';
import path from 'path'

const privateKey = fs.readFileSync(path.resolve(__dirname, '../../keys/jwt.key'), 'utf-8');

export const GenerateToken : RequestHandler = (req, res, next) => {
    if (!req.body.api_key) return next(createHttpError(400, 'Invalid body. Must include api_key.'));

    res.status(201).json(
        {
            token: jwt.sign({
                api_key: req.body.api_key,
                },
                privateKey,
                {
                    algorithm: 'RS256'
                }
            )
        }
    )
}