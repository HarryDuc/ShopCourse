import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  createComment,
  getCourseComments,
  updateComment,
  deleteComment,
  moderateComment,
  getPendingComments,
  getAllCommentsForAdmin,
  toggleAutoApprove,
  getAutoApproveStatus,
} from "../controllers/commentController.js";

const router = express.Router();

// Public routes
router.get("/course/:courseId", getCourseComments);

// Protected routes
router.post("/", isAuthenticated, createComment);

// Admin routes
router.use(isAuthenticated, isAdmin);

// Đặt các routes cụ thể trước routes có params
router.get("/pending", getPendingComments);
router.get("/admin", getAllCommentsForAdmin);
router.get("/auto-approve", getAutoApproveStatus);
router.put("/auto-approve", toggleAutoApprove);

// Routes có params đặt sau cùng
router.put("/:id", isAuthenticated, updateComment);
router.delete("/:id", isAuthenticated, deleteComment);
router.put("/:id/moderate", moderateComment);

export default router;
