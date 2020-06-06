import express from "express";
import { ItemLookup } from "./item"
import { ProfitLookup } from "./profit"
import { StatsCalc } from "./stats";
import { CachedResponse } from "./cache";

const router = express.Router();

router.get('/item/:id', ItemLookup);
router.get('/profit_split/:bal/:timeframe', ProfitLookup);
router.get('/stats', StatsCalc);
router.get('/cache', CachedResponse);

export default router;