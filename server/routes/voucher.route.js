import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createVoucher, getAllVouchers, updateVoucher, deleteVoucher, validateVoucher } from "../controllers/voucher.controller.js";

const router = express.Router();

router.post("/create", isAuthenticated, createVoucher);
router.get("/", isAuthenticated, getAllVouchers);
router.put("/:id", isAuthenticated, updateVoucher);
router.delete("/:id", isAuthenticated, deleteVoucher);
router.post("/validate", isAuthenticated, validateVoucher);

export default router;