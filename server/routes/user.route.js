import express from "express";
import {
  approveInstructorRequest,
  getAllUsers,
  getInstructorRequests,
  getUserById,
  getUserProfile,
  login,
  logout,
  register,
  rejectInstructorRequest,
  requestInstructorRole,
  updateProfile,
  updateUserRole,
} from "../controllers/user.controller.js";
import isAdmin from "../middlewares/isAdmin.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Public routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);

// User routes
router.route("/profile").get(isAuthenticated, getUserProfile);
router
  .route("/profile/update")
  .put(isAuthenticated, upload.single("profilePhoto"), updateProfile);
router
  .route("/request-instructor")
  .post(isAuthenticated, requestInstructorRole);

// Admin routes
router.route("/admin/users").get(isAuthenticated, isAdmin, getAllUsers);
router.route("/admin/users/:id").get(isAuthenticated, isAdmin, getUserById);
router
  .route("/admin/users/:id/role")
  .put(isAuthenticated, isAdmin, updateUserRole);
router
  .route("/admin/instructor-requests")
  .get(isAuthenticated, isAdmin, getInstructorRequests);
router
  .route("/admin/instructor-requests/:id/approve")
  .put(isAuthenticated, isAdmin, approveInstructorRequest);
router
  .route("/admin/instructor-requests/:id/reject")
  .put(isAuthenticated, isAdmin, rejectInstructorRequest);

export default router;
