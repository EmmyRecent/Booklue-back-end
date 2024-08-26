import express from "express";
import { getBooks } from "../controllers/apicontroller.js";

const router = express.Router();

// API endpoint to search for books
router.get("/api/search", getBooks);

export default router;
