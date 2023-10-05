const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const url = require("url");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// route page first page
app.get("/", (req, res, next) => {
  res.send(
    "Welcome to our page Please enter an endpoint like <br> /books to list the books <br> or /books/:id to get the details about that book"
  );
});

//get the books list from json file and  render it
app.get("/books", (req, res, next) => {
  fs.readFile("books.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.send("the file doesn't exist");
      return;
    }
    const booksData = JSON.parse(data);
    const books = [];
    for (const book of booksData.books) {
      books.push(book);
    }
    res.render("books", { books });
  });
});

// get the book id and render the details of the given id's book
app.get("/books/:id", (req, res, next) => {
  fs.readFile("books.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("the file doesn't exist");
      return;
    }
    const bookId = parseInt(req.params.id);
    const booksData = JSON.parse(data);
    const book = booksData.books.find((book) => book.id === bookId);
    if (!book) {
      res.status(404).send("Book not found");
      return;
    }

    res.render("bookDetails", { book });
  });
});

// add a new book to the json file if it exist or create file and add data to it if their is no file
app.post("/books", (req, res) => {
  let { books } = req.body;

  if (!books) {
    res
      .status(400)
      .send(
        "Invalid request. Please provide book(s) in the request body. You should put the name of the object if it's one book, and if there are multiple books, you should make an array of book objects."
      );
    return;
  }

  if (!Array.isArray(books)) {
    books = [books];
  }

  for (const book of books) {
    book.id = parseInt(book.id);

    if (isNaN(book.id) || !Number.isInteger(book.id)) {
      res
        .status(400)
        .send("Invalid ID. Please enter a valid number for the ID.");
      return;
    }

    if (typeof book.name !== "string" || book.name.trim() === "") {
      res
        .status(400)
        .send("Invalid name. Please enter a non-empty string for the name.");
      return;
    }
  }

  fs.readFile("books.json", "utf8", (readErr, data) => {
    let booksData = { books: [] };

    if (!readErr) {
      try {
        booksData = JSON.parse(data);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        res.status(500).send("Error parsing JSON");
        return;
      }
    }

    // Check if any of the new books have duplicate IDs in the existing data
    const existingIds = booksData.books.map((book) => book.id);
    for (const book of books) {
      if (existingIds.includes(book.id)) {
        res.status(400).send(`Book with ID ${book.id} already exists.`);
        return;
      }
    }

    booksData.books = booksData.books.concat(books);

    fs.writeFile(
      "books.json",
      JSON.stringify(booksData, null, 2),
      "utf8",
      (writeErr) => {
        if (writeErr) {
          console.error("Error writing file:", writeErr);
          res.status(500).send("Error writing file:");
          return;
        }

        res.status(200).send("Book(s) added successfully");
      }
    );
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error
  res.status(500).send("Internal Server Error");
});

// Catch-all route for invalid endpoints
app.use((req, res) => {
  res
    .status(404)
    .send(
      "Endpoint not found Please enter an valid endpoint like <br> /books to list the books <br> or /books/:id to get the details about that book"
    );
});

const host = "localhost";
const port = 3000;
// Start the server on port 3000
app.listen(port, host, () => {
  console.log(`Server is listening on http://${host}:${port}`);
});
