import express from "express";
import { ItemLookup } from "./item"
import { ProfitLookup } from "./profit"
import { StatsCalc } from "./stats";

const router = express.Router();

router.get('/item/:id', ItemLookup);
router.get('/profit_split/:bal/:timeframe', ProfitLookup);
router.get('/stats', StatsCalc);

export default router;