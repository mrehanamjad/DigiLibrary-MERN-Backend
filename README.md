
# 📚 DigiLibrary-backend-node-express

A Node.js + Express + TypeScript backend for managing a digital library.

---

## ✅ User Routes Test Checklist

| Method | Endpoint                        | Middleware          | Description                  | Tested |
| ------ | ------------------------------- | ------------------- | ---------------------------- | ------ |
| POST   | `/api/v1/users/register`        | –                   | Register a new user          | ✅      |
| POST   | `/api/v1/users/login`           | –                   | Login a user                 | ✅      |
| POST   | `/api/v1/users/logout`          | `verifyJWT`         | Logout the current user      | ✅      |
| POST   | `/api/v1/users/refresh-token`   | –                   | Refresh access token         | ✅      |
| GET    | `/api/v1/users/current-user`    | `verifyJWT`         | Get current logged-in user   | ✅      |
| PATCH  | `/api/v1/users/change-password` | `verifyJWT`         | Change user password         | ✅      |
| PATCH  | `/api/v1/users/change-email`    | `verifyJWT`         | Change user email            | ✅      |
| PATCH  | `/api/v1/users/update-profile`  | `verifyJWT`         | Update profile info          | ✅      |
| DELETE | `/api/v1/users/delete-account`  | `verifyJWT`         | Delete user account          | ✅      |
| PATCH  | `/api/v1/users/avatar`          | `verifyJWT, multer` | Update avatar image          | ✅      |
| PATCH  | `/api/v1/users/cover-image`     | `verifyJWT, multer` | Update cover image           | ✅      |
| DELETE | `/api/v1/users/:type`           | `verifyJWT`         | Delete avatar or cover image | ✅      |

---

## ✅ Book Routes Test Checklist

| Method | Endpoint                               | Auth Required | Description                           | Tested |
| ------ | -------------------------------------- | ------------- | ------------------------------------- | ------ |
| GET    | `/api/v1/books`                        | ❌ No          | Get all published books               | ✅      |
| POST   | `/api/v1/books`                        | ✅ Yes         | Publish a new book (with file upload) | ✅      |
| GET    | `/api/v1/books/:bookId`                | ❌ No          | Get single book details               | ✅      |
| PATCH  | `/api/v1/books/:bookId`                | ✅ Yes         | Update book metadata                  | ✅      |
| DELETE | `/api/v1/books/:bookId`                | ✅ Yes         | Delete a book                         | ✅      |
| PATCH  | `/api/v1/books/:bookId/cover-image`    | ✅ Yes         | Update only the book cover image      | ✅      |
| PATCH  | `/api/v1/books/:bookId/toggle-publish` | ✅ Yes         | Toggle book's publish status          | ✅      |
| GET    | `/api/v1/books/my`                     | ✅ Yes         | Get books owned by the logged-in user | ✅      |

---

## Comment Routes Test Checklist

| Method | Endpoint                              | Auth Required | Description                                       | Tested |
| ------ | ------------------------------------- | ------------- | ------------------------------------------------- | ------ |
| GET    | `/api/v1/comments/book/:bookId`       | ❌ No          | Get all top-level comments for a book (paginated) | ✅      |
| POST   | `/api/v1/comments/book/:bookId`       | ✅ Yes         | Add a new comment to a book                       | ✅      |
| GET    | `/api/v1/comments/:commentId/replies` | ❌ No          | Get all replies for a specific comment            | ✅      |
| PATCH  | `/api/v1/comments/:commentId`         | ✅ Yes         | Update a comment (only by the owner)              | ✅      |
| DELETE | `/api/v1/comments/:commentId`         | ✅ Yes         | Delete a comment (only by the owner)              | ✅      |

---