import express from "express";
import {
  getBannedWords,
  addBannedWord,
  updateBannedWord,
  deleteBannedWord,
} from "../controllers/bannedWordController.js";
import isAdmin from "../middlewares/isAdmin.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Tất cả các routes đều yêu cầu xác thực và quyền admin
router.use(isAuthenticated, isAdmin);

router.route("/").get(getBannedWords).post(addBannedWord);

router.route("/:id").put(updateBannedWord).delete(deleteBannedWord);

export default router;
