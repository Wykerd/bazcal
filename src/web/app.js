import express from 'express';

import fs from 'fs';
import path from 'path';

import UserScript from '../models/scriptSchema';
import { Transpiler } from "../../lib/index"

const app = express();

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

app.route('/custom/js/:id')
    .get(async (req, res) => {
        const { id } = req.params;

        const script = await UserScript.findById(id);

        if (!script) return res.status(404).contentType('application/javacript').send('window.compiled_code=function(){console.warn(\'No script with ID ' + id + ' found\', arguments)}');

        const transpiler = new Transpiler();

        transpiler.extern(["get_property", "typeof", "len", "map", "join", "sort", "filter", "slice", "parse_num", "kill_scheduler", "advise", "raw_advise", "format_number", "round", "default_advise_formatter", "item_name", "cache_hook", "item_cache", "arguments", "get_current_channel", "get_private_channel", "messages_sent", "send_message"]);

        const handler = transpiler.transpile({
            type: "sequence",
            seq: script.ast
        }, [0, 1]);

        return res.status(200).contentType('application/javacript').send('window.compiled_code=function(_0, message){' + handler + '}');
    });

app.use('/', express.static(path.resolve(__dirname, '../../static')));

export default app;