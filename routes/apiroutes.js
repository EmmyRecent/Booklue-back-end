import express from "express";
import { addBooks, addUserBooks, getBooks, getUserBooks } from "../controllers/apicontroller.js";

const router = express.Router();

// API endpoint to search for books
router.get("/api/search", getBooks);
router.get("/api/getUserBooks", getUserBooks);
//
router.post("/api/addBookmark", addBooks);
router.post("/api/userBooks", addUserBooks);

export default router;
