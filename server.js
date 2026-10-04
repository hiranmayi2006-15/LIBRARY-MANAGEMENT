const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// FRONTEND
// =====================================================

// This tells Express to use the public folder
// for HTML, CSS and JavaScript files.

app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// MYSQL CONNECTION
// =====================================================

const db = mysql.createConnection({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT || 3306

});


db.connect((err) => {

    if (err) {

        console.error("❌ MySQL connection failed:");

        console.error(err.message);

        return;

    }

    console.log("✅ MySQL connected successfully");

});


// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


// =====================================================
// TEST API
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({
        message: "Library Management API is working"
    });

});


// =====================================================
// GET ALL BOOKS
// =====================================================

app.get("/api/books", (req, res) => {

    const sql = `

        SELECT
            books.book_id,
            books.title,
            books.author_id,
            authors.author_name,
            books.category,
            books.quantity

        FROM books

        LEFT JOIN authors
        ON books.author_id = authors.author_id

        ORDER BY books.book_id

    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch books"
            });

        }


        res.json(results);

    });

});


// =====================================================
// GET ALL STUDENTS
// =====================================================

app.get("/api/students", (req, res) => {

    const sql = `

        SELECT
            student_id,
            name,
            department,
            phone

        FROM students

        ORDER BY student_id

    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch students"
            });

        }


        res.json(results);

    });

});


// =====================================================
// GET ALL ISSUES
// =====================================================

app.get("/api/issues", (req, res) => {

    const sql = `

        SELECT
            issued_books.issue_id,
            issued_books.student_id,
            students.name AS student_name,

            issued_books.book_id,
            books.title,

            issued_books.issue_date,
            issued_books.due_date,
            issued_books.return_date,
            issued_books.status

        FROM issued_books

        LEFT JOIN students
        ON issued_books.student_id = students.student_id

        LEFT JOIN books
        ON issued_books.book_id = books.book_id

        ORDER BY issued_books.issue_id DESC

    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch issues"
            });

        }


        res.json(results);

    });

});


// =====================================================
// DASHBOARD
// =====================================================

app.get("/api/dashboard", (req, res) => {

    const sql = `

        SELECT

        (SELECT COUNT(*)
         FROM books) AS total_books,

        (SELECT COALESCE(SUM(quantity), 0)
         FROM books) AS available_copies,

        (SELECT COUNT(*)
         FROM students) AS total_students,

        (SELECT COUNT(*)
         FROM issued_books
         WHERE status = 'Issued') AS issued_books,

        (SELECT COUNT(*)
         FROM issued_books
         WHERE status = 'Returned') AS returned_books

    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                message: "Failed to load dashboard"
            });

        }


        res.json(results[0]);

    });

});


// =====================================================
// ADD STUDENT
// =====================================================

app.post("/api/students", (req, res) => {

    const {
        name,
        department,
        phone
    } = req.body;


    if (!name || !department || !phone) {

        return res.status(400).json({
            message: "All student fields are required"
        });

    }


    const sql = `

        INSERT INTO students
        (name, department, phone)

        VALUES (?, ?, ?)

    `;


    db.query(
        sql,
        [name, department, phone],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to add student"
                });

            }


            res.status(201).json({

                message: "Student added successfully",

                student_id: result.insertId

            });

        }
    );

});


// =====================================================
// ISSUE BOOK
// =====================================================

app.post("/api/issue", (req, res) => {

    const {
        student_id,
        book_id,
        due_date
    } = req.body;


    if (!student_id || !book_id || !due_date) {

        return res.status(400).json({
            message: "Student, book and due date are required"
        });

    }


    // First check whether book is available

    const checkBookSql = `

        SELECT quantity

        FROM books

        WHERE book_id = ?

        AND quantity > 0

    `;


    db.query(
        checkBookSql,
        [book_id],
        (err, books) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to check book availability"
                });

            }


            if (books.length === 0) {

                return res.status(400).json({
                    message: "Book is not available"
                });

            }


            // Insert issue record

            const issueSql = `

                INSERT INTO issued_books
                (
                    student_id,
                    book_id,
                    issue_date,
                    due_date,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    CURDATE(),
                    ?,
                    'Issued'
                )

            `;


            db.query(
                issueSql,
                [student_id, book_id, due_date],
                (err, result) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            message: "Failed to issue book"
                        });

                    }


                    // Decrease book quantity

                    const updateBookSql = `

                        UPDATE books

                        SET quantity = quantity - 1

                        WHERE book_id = ?

                    `;


                    db.query(
                        updateBookSql,
                        [book_id],
                        (err) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    message: "Book issued but quantity update failed"
                                });

                            }


                            res.status(201).json({

                                message: "Book issued successfully",

                                issue_id: result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// RETURN BOOK
// =====================================================

app.put("/api/return/:issue_id", (req, res) => {

    const issueId = req.params.issue_id;


    // First find the issue

    const findIssueSql = `

        SELECT
            book_id,
            status

        FROM issued_books

        WHERE issue_id = ?

    `;


    db.query(
        findIssueSql,
        [issueId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to find issue"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    message: "Issue record not found"
                });

            }


            const issue = results[0];


            if (issue.status === "Returned") {

                return res.status(400).json({
                    message: "Book has already been returned"
                });

            }


            // Update issue record

            const returnSql = `

                UPDATE issued_books

                SET
                    return_date = CURDATE(),
                    status = 'Returned'

                WHERE issue_id = ?

            `;


            db.query(
                returnSql,
                [issueId],
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            message: "Failed to return book"
                        });

                    }


                    // Increase book quantity

                    const updateBookSql = `

                        UPDATE books

                        SET quantity = quantity + 1

                        WHERE book_id = ?

                    `;


                    db.query(
                        updateBookSql,
                        [issue.book_id],
                        (err) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    message: "Book returned but quantity update failed"
                                });

                            }


                            res.json({

                                message: "Book returned successfully"

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(`🚀 Server running at http://localhost:${PORT}`);

});