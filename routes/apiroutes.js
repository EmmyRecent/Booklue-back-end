import express from "express";
import {
  addBooks,
  addUserBooks,
  deleteUserBook,
  getBooks,
  getReviewBookPosts,
  getReviewPostsDetails,
  getUserBooks,
  getUserReviewedBooks,
  updateReviewBooks,
} from "../controllers/apicontroller.js";

const router = express.Router();

// API endpoint to search for books
router.get("/api/search", getBooks);
router.get("/api/getUserBooks", getUserBooks);
router.get("/api/getUserReviewedBooks", getUserReviewedBooks);
router.get("/api/getReviewBookPosts", getReviewBookPosts);
router.get("/api/getReviewPostsDetails", getReviewPostsDetails);
//
router.post("/api/addBookmark", addBooks);
router.post("/api/userBooks", addUserBooks);
router.post("/api/updateReviewBooks", updateReviewBooks);
//
router.delete("/api/deleteUserBook", deleteUserBook);

export default router;
