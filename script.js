// =====================================================
// LIBRARY MANAGEMENT SYSTEM - FRONTEND JAVASCRIPT
// =====================================================


// ================= PAGE NAVIGATION =================

function showSection(sectionId, button) {

    // Hide all sections
    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active-section");
    });

    // Show selected section
    document.getElementById(sectionId).classList.add("active-section");


    // Remove active from all navigation buttons
    const buttons = document.querySelectorAll(".nav-btn");

    buttons.forEach(btn => {
        btn.classList.remove("active");
    });


    // Add active to clicked button
    button.classList.add("active");


    // Change page title
    const titles = {
        dashboard: "Dashboard",
        books: "Books",
        students: "Students",
        transactions: "Issue / Return"
    };

    document.getElementById("pageTitle").textContent = titles[sectionId];


    // Load data when section is opened
    if (sectionId === "dashboard") {
        loadDashboard();
    }

    if (sectionId === "books") {
        loadBooks();
    }

    if (sectionId === "students") {
        loadStudents();
    }

    if (sectionId === "transactions") {
        loadStudentsForIssue();
        loadBooksForIssue();
        loadIssues();
    }
}



// ================= MESSAGE =================

function showMessage(message) {

    const box = document.getElementById("messageBox");

    box.innerHTML = `
        <div class="message">
            ${message}
        </div>
    `;

    setTimeout(() => {
        box.innerHTML = "";
    }, 3000);
}



// ================= DASHBOARD =================

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Dashboard API failed");
        }

        const data = await response.json();


        document.getElementById("totalBooks").textContent =
            data.total_books || 0;

        document.getElementById("availableCopies").textContent =
            data.available_copies || 0;

        document.getElementById("totalStudents").textContent =
            data.total_students || 0;

        document.getElementById("issuedBooks").textContent =
            data.issued_books || 0;


        // Load recent transactions
        loadDashboardTransactions();

    } catch (error) {

        console.error(error);

        showMessage("Unable to load dashboard");

    }
}



// ================= DASHBOARD TRANSACTIONS =================

async function loadDashboardTransactions() {

    try {

        const response = await fetch("/api/issues");

        const issues = await response.json();

        const table = document.getElementById("dashboardTransactions");

        table.innerHTML = "";


        const recentIssues = issues.slice(0, 5);


        if (recentIssues.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        No transactions found
                    </td>
                </tr>
            `;

            return;
        }


        recentIssues.forEach(issue => {

            table.innerHTML += `

                <tr>

                    <td>${issue.issue_id}</td>

                    <td>
                        ${issue.student_name || issue.name || issue.student_id}
                    </td>

                    <td>
                        ${issue.title || issue.book_title || issue.book_id}
                    </td>

                    <td>${formatDate(issue.issue_date)}</td>

                    <td>${formatDate(issue.due_date)}</td>

                    <td>
                        ${getStatusBadge(issue.status)}
                    </td>

                </tr>

            `;

        });


    } catch (error) {

        console.error(error);

    }
}



// ================= BOOKS =================

let allBooks = [];


async function loadBooks() {

    try {

        const response = await fetch("/api/books");

        if (!response.ok) {
            throw new Error("Books API failed");
        }

        allBooks = await response.json();

        displayBooks(allBooks);

    } catch (error) {

        console.error(error);

        showMessage("Unable to load books");

    }
}



function displayBooks(books) {

    const table = document.getElementById("booksTable");

    table.innerHTML = "";


    if (books.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No books found
                </td>
            </tr>
        `;

        return;
    }


    books.forEach(book => {

        const quantity = Number(book.quantity || 0);

        const availability =
            quantity > 0
                ? `<span class="badge badge-available">Available</span>`
                : `<span class="badge badge-unavailable">Unavailable</span>`;


        table.innerHTML += `

            <tr>

                <td>${book.book_id}</td>

                <td><strong>${book.title}</strong></td>

                <td>
                    ${book.author_name || book.author || book.author_id}
                </td>

                <td>
                    ${book.category || "-"}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ${availability}
                </td>

            </tr>

        `;

    });

}



// ================= BOOK SEARCH =================

function filterBooks() {

    const search =
        document.getElementById("bookSearch")
        .value
        .toLowerCase();


    const filtered = allBooks.filter(book => {

        const title =
            String(book.title || "").toLowerCase();

        const author =
            String(
                book.author_name ||
                book.author ||
                ""
            ).toLowerCase();

        const category =
            String(book.category || "").toLowerCase();


        return (
            title.includes(search) ||
            author.includes(search) ||
            category.includes(search)
        );

    });


    displayBooks(filtered);
}



// ================= STUDENTS =================

async function loadStudents() {

    try {

        const response = await fetch("/api/students");

        if (!response.ok) {
            throw new Error("Students API failed");
        }

        const students = await response.json();

        displayStudents(students);

    } catch (error) {

        console.error(error);

        showMessage("Unable to load students");

    }
}



function displayStudents(students) {

    const table = document.getElementById("studentsTable");

    table.innerHTML = "";


    if (students.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    No students found
                </td>
            </tr>
        `;

        return;
    }


    students.forEach(student => {

        table.innerHTML += `

            <tr>

                <td>${student.student_id}</td>

                <td>
                    <strong>${student.name}</strong>
                </td>

                <td>
                    ${student.department || "-"}
                </td>

                <td>
                    ${student.phone || "-"}
                </td>

            </tr>

        `;

    });

}



// ================= ADD STUDENT =================

function openStudentForm() {

    document
        .getElementById("studentForm")
        .classList.add("show");

}



function closeStudentForm() {

    document
        .getElementById("studentForm")
        .classList.remove("show");

}



async function addStudent(event) {

    event.preventDefault();


    const name =
        document.getElementById("studentName").value.trim();

    const department =
        document.getElementById("studentDepartment").value.trim();

    const phone =
        document.getElementById("studentPhone").value.trim();


    try {

        const response = await fetch("/api/students", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                department: department,
                phone: phone
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to add student"
            );

        }


        showMessage("Student added successfully");


        // Clear form
        document.getElementById("studentName").value = "";
        document.getElementById("studentDepartment").value = "";
        document.getElementById("studentPhone").value = "";


        closeStudentForm();

        loadStudents();


    } catch (error) {

        console.error(error);

        showMessage(error.message);

    }

}



// ================= STUDENTS FOR ISSUE =================

async function loadStudentsForIssue() {

    try {

        const response = await fetch("/api/students");

        const students = await response.json();

        const select =
            document.getElementById("issueStudent");


        select.innerHTML =
            `<option value="">Select Student</option>`;


        students.forEach(student => {

            select.innerHTML += `

                <option value="${student.student_id}">
                    ${student.name} - ${student.department || ""}
                </option>

            `;

        });

    } catch (error) {

        console.error(error);

    }

}



// ================= BOOKS FOR ISSUE =================

async function loadBooksForIssue() {

    try {

        const response = await fetch("/api/books");

        const books = await response.json();

        const select =
            document.getElementById("issueBook");


        select.innerHTML =
            `<option value="">Select Book</option>`;


        books
            .filter(book => Number(book.quantity) > 0)
            .forEach(book => {

                select.innerHTML += `

                    <option value="${book.book_id}">
                        ${book.title} (${book.quantity} available)
                    </option>

                `;

            });

    } catch (error) {

        console.error(error);

    }

}



// ================= ISSUE BOOK =================

async function issueBook(event) {

    event.preventDefault();


    const studentId =
        document.getElementById("issueStudent").value;

    const bookId =
        document.getElementById("issueBook").value;

    const dueDate =
        document.getElementById("dueDate").value;


    if (!studentId || !bookId || !dueDate) {

        showMessage("Please fill all fields");

        return;

    }


    try {

        const response = await fetch("/api/issue", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                student_id: Number(studentId),

                book_id: Number(bookId),

                due_date: dueDate

            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to issue book"
            );

        }


        showMessage("Book issued successfully");


        // Reset form
        document.getElementById("issueStudent").value = "";
        document.getElementById("issueBook").value = "";
        document.getElementById("dueDate").value = "";


        // Refresh tables
        loadIssues();
        loadBooksForIssue();
        loadDashboard();


    } catch (error) {

        console.error(error);

        showMessage(error.message);

    }

}



// ================= ISSUES =================

async function loadIssues() {

    try {

        const response = await fetch("/api/issues");

        if (!response.ok) {
            throw new Error("Issues API failed");
        }

        const issues = await response.json();

        displayIssues(issues);

    } catch (error) {

        console.error(error);

        showMessage("Unable to load transactions");

    }

}



function displayIssues(issues) {

    const table =
        document.getElementById("issuesTable");

    table.innerHTML = "";


    if (issues.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    No transactions found
                </td>
            </tr>
        `;

        return;

    }


    issues.forEach(issue => {

        const returnButton =
            String(issue.status).toLowerCase() === "issued"

                ? `
                    <button
                        class="return-btn"
                        onclick="returnBook(${issue.issue_id})"
                    >
                        Return
                    </button>
                  `

                : "-";


        table.innerHTML += `

            <tr>

                <td>${issue.issue_id}</td>

                <td>
                    ${issue.student_name || issue.name || issue.student_id}
                </td>

                <td>
                    ${issue.title || issue.book_title || issue.book_id}
                </td>

                <td>
                    ${formatDate(issue.issue_date)}
                </td>

                <td>
                    ${formatDate(issue.due_date)}
                </td>

                <td>
                    ${formatDate(issue.return_date)}
                </td>

                <td>
                    ${getStatusBadge(issue.status)}
                </td>

                <td>
                    ${returnButton}
                </td>

            </tr>

        `;

    });

}



// ================= RETURN BOOK =================

async function returnBook(issueId) {

    const confirmReturn =
        confirm("Are you sure you want to return this book?");


    if (!confirmReturn) {
        return;
    }


    try {

        const response =
            await fetch(`/api/return/${issueId}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                }

            });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to return book"
            );

        }


        showMessage("Book returned successfully");


        loadIssues();

        loadBooksForIssue();

        loadDashboard();


    } catch (error) {

        console.error(error);

        showMessage(error.message);

    }

}



// ================= STATUS BADGE =================

function getStatusBadge(status) {

    if (
        String(status).toLowerCase() === "returned"
    ) {

        return `
            <span class="badge badge-returned">
                Returned
            </span>
        `;

    }


    return `
        <span class="badge badge-issued">
            Issued
        </span>
    `;

}



// ================= DATE FORMAT =================

function formatDate(date) {

    if (!date) {
        return "-";
    }


    const d = new Date(date);


    if (isNaN(d.getTime())) {
        return date;
    }


    return d.toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });

}



// ================= INITIAL LOAD =================

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

    loadBooks();

    loadStudents();

    loadIssues();

});