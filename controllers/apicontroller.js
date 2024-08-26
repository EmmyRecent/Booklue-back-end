import axios from "axios";

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
