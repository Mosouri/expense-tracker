// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const PORT = process.env.PORT || 5000;

app.get("/api/expenses", (req, res) => {
  pool
    .query(
      `
      SELECT
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      ORDER BY id;
    `,
    )
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "All Expenses",
        result: result.rows,
      });
    })
    .catch((error) => {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    });
});

app.get("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  pool
    .query(
      `
        SELECT
          id,
          title,
          amount::float8 AS amount,
          category,
          to_char(date, 'YYYY-MM-DD') AS date
        FROM expenses
        WHERE id = $1;
      `,
      [id],
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Expense found",
        result: result.rows[0],
      });
    })
    .catch((error) => {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    });
});

app.post("/api/expenses", (req, res) => {
  const { title, amount, category, date } = req.body;

  pool
    .query(
      `
        INSERT INTO expenses
          (title, amount, category, date)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          id,
          title,
          amount::float8 AS amount,
          category,
          to_char(date, 'YYYY-MM-DD') AS date;
      `,
      [title, amount, category, date],
    )
    .then((result) => {
      res.status(201).json({
        success: true,
        message: "Expense added successfully",
        result: result.rows[0],
      });
    })
    .catch((error) => {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    });
});

app.put("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  pool
    .query(
      `
        UPDATE expenses
        SET
          title = COALESCE($1, title),
          amount = COALESCE($2, amount),
          category = COALESCE($3, category),
          date = COALESCE($4, date)
        WHERE id = $5
        RETURNING
          id,
          title,
          amount::float8 AS amount,
          category,
          to_char(date, 'YYYY-MM-DD') AS date;
      `,
      [title, amount, category, date, id],
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        result: result.rows[0],
      });
    })
    .catch((error) => {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    });
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  pool
    .query(
      `
        DELETE FROM expenses
        WHERE id = $1
        RETURNING
          id,
          title,
          amount::float8 AS amount,
          category,
          to_char(date, 'YYYY-MM-DD') AS date;
      `,
      [id],
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Expense deleted successfully",
        result: result.rows[0],
      });
    })
    .catch((error) => {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
