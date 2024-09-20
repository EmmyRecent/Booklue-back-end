import axios from "axios";
import db from "../config/db.js";
import { Server } from "socket.io";

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
  const { id, sort } = req.query;
  const validSortColumns = ["Title", "Author", "added_at"];
  // Ensure sort column is a valid column to prevent sql injection.
  const sortColumn = validSortColumns.includes(sort) ? sort : "Title"; // Default to title if invalid.

  try {
    const result = await db.query(
      `
      SELECT
        books.id, books.title, books.author, books.language, books.cover_image, userbooks.rating, userbooks.notes, userbooks.read_date
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
        users.id = $1
      ORDER BY
        books.${sortColumn} ASC;
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

export const getSortUserBooks = async (req, res) => {
  const { id, sort } = req.query;

  // Valid sort columns for safety against SQL injection
  const validSortColumns = ["Title", "Author", "read_date", "rating"];

  // Ensure sort column is valid, default to 'Title' if invalid
  const clientSortColumn = validSortColumns.includes(sort) ? sort : "Title";
  // console.log("Client sort:", sort);
  // console.log("Sorting reviewed books by:", clientSortColumn);

  // Track if it's a userbooks or books column
  let sortColumn;

  const validUserBooksColumns = ["rating", "read_date"];
  const validBooksColumns = ["Title", "Author"];

  // Set sortColumn based on where the field is coming from.
  if (validUserBooksColumns.includes(clientSortColumn)) {
    sortColumn = `userbooks.${clientSortColumn}`;
  } else if (validBooksColumns.includes(clientSortColumn)) {
    sortColumn = `books.${clientSortColumn.toLowerCase()}`; // Ensure lowercase for column names in DB
  } else {
    // Default to books.title if no valid column provided
    sortColumn = "books.title";
  }

  try {
    const result = await db.query(
      `
       SELECT 
        books.id, books.title, books.author, books.cover_image, users.id, users.name, users.profile_picture, userbooks.rating, userbooks.notes, userbooks.read_date, userbooks.reviewed
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
        users.id = $1
      AND 
        userbooks.reviewed = true
      ORDER BY 
       ${sortColumn} ASC;
      `,
      [id]
    );

    console.log(`Sorted books by ${sortColumn}: ${result.rows}`);

    res.status(200).json({ message: "Success!", data: result.rows });
  } catch (err) {
    console.log("Error getting sort review books:", err.stack);

    res.status(500).json({ message: "Internal server error!", error: err });
  }
};

export const deleteUserBook = async (req, res) => {
  const { user_id, book_id } = req.query;

  console.log("User id:", user_id);
  console.log("Book id:", book_id);

  try {
    await db.query(
      `
      DELETE FROM userBooks WHERE user_id = $1 AND book_id = $2;
      `,
      [user_id, book_id]
    );

    res.status(200).json({ message: "Book removed successfully!" });
  } catch (err) {
    console.log("Error deleting user Books", err);

    res.status(500).json({ message: "internal server error!", error: "Error deleting books" });
  }
};

export const updateReviewBooks = async (req, res) => {
  console.log(req.body);

  const { userId, bookId, rating, dateRead, notes, reviewed } = req.body;

  if (!rating || !notes || !dateRead) {
    return res.status(400).json({ message: "Cannot review book, please enter review info!" });
  }

  try {
    // Update userbooks. emit the socket.
    const result = await db.query(
      `
      UPDATE userbooks
      SET rating = $1, notes = $2, read_date = $3, reviewed = $4 
      WHERE user_id = $5 AND book_id = $6;
      `,
      [rating, notes, dateRead, reviewed, userId, bookId]
    );

    // Fetch the updated userbooks data.
    const result2 = await db.query(
      `
      SELECT 
        books.id, books.title, books.author, books.cover_image, users.id, users.name, users.profile_picture, userbooks.rating, userbooks.notes, userbooks.read_date, userbooks.reviewed
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
        users.id = $1
      AND 
        userbooks.reviewed = true
      ORDER BY
        books.title 
      ASC;
      `,
      [userId]
    );

    await db.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Reviewed books updated successfully", data: result2.rows });
  } catch (err) {
    await db.query("ROLLBACK");

    console.log("Error Updating reviewed books!", err);

    return res
      .status(500)
      .json({ message: "internal server error!", error: "Error deleting books" });
  }
};

export const getUserReviewedBooks = async (req, res) => {
  console.log("Get reviewed books");

  const { id } = req.query;

  try {
    const result = await db.query(
      `
      SELECT 
        books.id AS book_id, books.title, books.author, books.cover_image, users.id, users.name, users.profile_picture, userbooks.rating, userbooks.notes, userbooks.read_date
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
        users.id = $1
      AND 
        userbooks.reviewed = true;
      `,
      [id]
    );

    const books = result.rows;

    res.status(200).json({ message: "Success!", data: books });
  } catch (err) {
    console.log("Error getting user reviewed books:", err);

    res.status(500).json({ message: "Internal server error!", error: err });
  }
};

export const getReviewBookPosts = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT	
        books.id AS book_id, books.title, books.author, books.cover_image, users.id, users.name, users.profile_picture, userbooks.rating, userbooks.notes, userbooks.read_date
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
	      userbooks.reviewed = true;
      `
    );

    // Emit a socket for real-time update to the connected clients.
    const io = req.app.get("socketio"); // socket.io instance for the app.
    io.emit("reviewBookPosts", result.rows); // Send the update book data to the client.

    res.status(200).json({ message: "success!", data: result.rows });
  } catch (err) {
    console.log("Error getting user book posts", err);

    res
      .status(500)
      .json({ message: "Internal server error!", error: "Error getting user book posts" });
  }
};

export const getReviewPostsDetails = async (req, res) => {
  console.log("Getting post details!");

  const { userId, bookId } = req.query;

  try {
    const result = await db.query(
      `
      SELECT
        books.id, books.title, books.author, books.cover_image, users.id, users.name, users.profile_picture, 		userbooks.rating, userbooks.notes, userbooks.read_date
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
	      userbooks.reviewed = true
      AND 
	      users.id = $1
      AND 
	      userbooks.book_id = $2;
      `,
      [userId, bookId]
    );

    res.status(200).json({ message: "Review Post details success!", data: result.rows[0] });
  } catch (err) {
    console.log("Error getting user reviewed books details:", err);

    res.status(500).json({ message: "Internal server error!", error: err });
  }
};
