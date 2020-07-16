import express from 'express';

import fs from 'fs';
import path from 'path';
import cors from 'cors';

import UserScript from '../models/scriptSchema';
import { Transpiler } from "../../lib/index";

const app = express();

app.use(cors());

app.route('/custom/repo')
    .get(async (_, res) => res.status(200)
        .json(
            await UserScript
                .find({})
                .select('script_public_name user_id script_name _id')
                .exec()
        )
    )

app.route('/custom/repo/public')
    .get(async (_, res) => res.status(200)
        .json(
            await UserScript
                .find({ script_public_name: { $exists: true } })
                .select('script_public_name user_id script_name _id')
                .exec()
        )
    )

app.route('/custom/repo/public/:name')
    .get(async (req, res) => {
        const scr = await UserScript.findOne({ script_public_name: req.params.name }).select('script_public_name user_id script_name _id script_raw')

        if (!scr) return res.status(404).json({ message: 'Script not found' });

        return res.status(200).json(scr);
    })

app.route('/custom/repo/:user_id/:script_name')
    .get(async (req, res) => {
        const scr = await UserScript.findOne({ user_id: req.params.user_id, script_name: req.params.script_name }).select('script_public_name user_id script_name _id script_raw');

        if (!scr) return res.status(404).json({ message: 'Script not found' });

        return res.status(200).json(scr);
    })

export default app;