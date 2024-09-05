import axios from "axios";
import db from "../config/db.js";

export const getBooks = async (req, res) => {
  const query = req.query.q;

  try {
    const response = await axios.get(`https://openlibrary.org/search.json?q=${query}`);

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching data from Open Library:", error);

    res.status(500).send("Server error");
  }
};

export const addBooks = async (req, res) => {
  const { title, author, language, cover } = req.body;

  try {
    const result = await db.query(
      `
      INSERT INTO Books (title, author, language, cover_image)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [title, author, language, cover]
    );

    res.status(200).json({ message: "Book added successfully!", data: result.rows[0] });
  } catch (err) {
    console.error("Error adding to books:", err);

    res.status(500).json({ message: "Error adding the book!", error: err });
  }
};

export const addUserBooks = async (req, res) => {
  const { user_id, book_id, rating, notes, read_date, visibility } = req.body;

  try {
    const result = await db.query(
      `
      INSERT INTO userbooks (user_id, book_id, rating, notes, read_date, visibility)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [user_id, book_id, rating, notes, read_date, visibility]
    );

    res.status(200).json({ message: "Users books added successfully!" });
  } catch (err) {
    console.log("Error adding to user's books", err);

    res.status(500).json({ message: "Internal server error!", error: err });
  }
};

export const getUserBooks = async (req, res) => {
  const { id } = req.query;

  try {
    const result = await db.query(
      `
      SELECT
        books.id, books.title, books.author, books.language, books.cover_image
      FROM 
        userbooks
      JOIN 
        books
      ON 
        userbooks.book_id = books.id
      JOIN 
        users
      ON 
        userbooks.user_id = users.id
      WHERE 
        users.id = $1;
      `,
      [id]
    );

    const books = result.rows;

    res.status(200).json({ data: books });
  } catch (err) {
    console.log("Error getting user books:", err);

    res.status(500).json({ message: "Internal server error!", error: err });
  }
};
