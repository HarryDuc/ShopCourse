import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createOrGetChat,
  addMessage,
  getAllChats,
  setSupportType,
  setChatSuccess,
  getUserCoursesAndInstructors,
  getChatById
} from "../controllers/chat.controller.js";

const router = express.Router();

// Chat routes
router.get("/current", isAuthenticated, createOrGetChat);
router.post("/new", isAuthenticated, createOrGetChat); // New endpoint for explicitly creating a new chat
router.post("/message", isAuthenticated, addMessage);
router.get("/all", isAuthenticated, getAllChats);
router.post("/support-type", isAuthenticated, setSupportType);
router.post("/success", isAuthenticated, setChatSuccess);
router.get("/courses-instructors", isAuthenticated, getUserCoursesAndInstructors);
router.get("/detail/:chatId", isAuthenticated, getChatById);

export default router;
