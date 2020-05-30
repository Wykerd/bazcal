import jwt from 'jsonwebtoken'
import fs from 'fs'
import { RequestHandler } from 'express'
import path from 'path'

const publicKey = fs.readFileSync(path.resolve(__dirname, '../../keys/jwt.key.pub'), 'utf-8');

const tokenAuth : RequestHandler = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            const authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer' || authorization.length !== 2) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.body._user = jwt.verify(
                authorization[1],
                publicKey,
                {
                    algorithms: ['RS256']
                }
            );
            return next();
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

export default tokenAuth