import express from "express";
import { ItemLookup } from "./item"
import { ProfitLookup } from "./profit"
import tokenAuth from "../middleware/auth";
import { GenerateToken } from "./authorize";

const router = express.Router();

router.get('/item/:id', [tokenAuth], ItemLookup);
router.get('/profit_split/:bal/:timeframe', [tokenAuth], ProfitLookup);
router.post('/authorize', GenerateToken);

export default router;