import express from "express";
import { ItemLookup } from "./item"
import { ProfitLookup } from "./profit"

const router = express.Router();

router.get('/item/:id', ItemLookup);
router.get('/profit_split/:bal/:timeframe', ProfitLookup);

export default router;