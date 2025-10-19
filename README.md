
# 📚 DigiLibrary-backend-node-express

A Node.js + Express + TypeScript backend for managing a digital library.

## 📚 DigiLibrary – Backend

This is the backend repository for **DigiLibrary**, a multi-vendor full-stack library website where users can read and purchase books. The application is built to support multiple sellers, robust content management, and secure transactions.

### 🚀 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **ExpressJS** | Fast, unopinionated, minimalist web framework for Node.js. |
| **Database** | **MongoDB** | NoSQL database for flexible data structure. |
| **Language** | **TypeScript** | Superset of JavaScript that adds static typing. |
| **Payments** | **Stripe Payments** | Handling secure and scalable payment processing for purchases and seller payouts. |
| **Media Management**| **ImageKit** | Optimized image and file delivery, storage, and manipulation (for covers, avatars, etc.). |
| **Authentication**| **JWT (JSON Web Tokens)**| Securely transmitting information between parties as a JSON object for user authentication and authorization. |
| **Database Ops**| **Aggregation** | Advanced MongoDB pipeline operations for data analysis and complex queries (e.g., dashboard data, trending books). |

***


### ✨ Key Features

| Category | Feature | Description | Technologies |
| :--- | :--- | :--- | :--- |
| **Authentication & Security** | **JWT-Based Authorization** | Secure user and seller access control using **JSON Web Tokens (JWT)** for all protected routes. | ExpressJS, JWT |
| | **Secure Account Management** | Dedicated endpoints for secure login, logout, password changes, email updates, and token refreshing. | ExpressJS, JWT |
| **Seller & Payments** | **Multi-Vendor System** | Supports multiple independent sellers to publish and manage their books on the platform. | MongoDB |
| | **Stripe Payment Integration** | Full support for secure book purchases and managing seller payouts through **Stripe Connect**. | Stripe Payments |
| | **Seller Dashboard Access** | Routes to create Stripe accounts, complete onboarding, and generate dashboard login links for sellers. | Stripe Payments |
| **Content Management** | **File and Image Handling** | Robust handling of book files (PDF/ePub) and cover images using **Multer** and optimized storage via **ImageKit**. | ImageKit, Multer |
| | **Book CRUD Operations** | Complete functionality for sellers to **Publish**, **Update**, **Delete**, and manage their book files and covers. | ExpressJS, ImageKit, MongoDB |
| | **Publish Status Control** | Sellers can toggle a book's visibility between **Draft** and **Published** status. | ExpressJS, MongoDB |
| **Data & Search** | **Advanced Data Querying** | Uses **MongoDB Aggregation** pipelines for complex data analysis, fetching rich statistics, and optimizing data retrieval (e.g., for seller dashboards or trending lists). | MongoDB Aggregation |
| | **Owner-Specific Views** | Secure routes to fetch books owned by the current seller (`/my`) and purchases made by the current user. | JWT, MongoDB |
| **User Interaction** | **Bookmarking** | Users can easily **toggle** and retrieve their personalized list of bookmarked items. | MongoDB |
| | **Commenting System** | Users can **add, update, and delete** comments on books, and **retrieve replies** to specific comments. | MongoDB |

***


### ⚙️ API Routes

The backend provides a comprehensive set of secure and public routes for book management, user interactions, seller operations, and core authentication.

#### 📖 Book Routes

Manage the lifecycle of books, including publishing, retrieval, and updating.

| Method | Route | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/books/my` | Get all books owned by the current logged-in user (seller). | `verifyJWT` |
| `GET` | `/api/v1/books` | Get a list of all published books (with optional filters/pagination). | None |
| `POST` | `/api/v1/books` | Publish a new book (with file upload for PDF/ePub and cover image). | `verifyJWT`, `upload.fields` |
| `GET` | `/api/v1/books/:bookId` | Get details of a specific book by ID. | None |
| `DELETE` | `/api/v1/books/:bookId` | Delete a specific book by ID (only by owner). | `verifyJWT` |
| `PATCH` | `/api/v1/books/:bookId` | Update details of a specific book. | `verifyJWT` |
| `PATCH` | `/api/v1/books/:bookId/cover-image`| Update the cover image of a specific book. | `verifyJWT`, `upload.single` |
| `PATCH` | `/api/v1/books/:bookId/toggle-publish`| Toggle the publish status of a book (Draft/Published). | `verifyJWT` |

***

#### 📌 Bookmark Routes

Allow users to manage a list of their favorite books.

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/bookmarks` | Get all books bookmarked by the current user. |
| `POST` | `/api/v1/bookmarks/:bookId` | Toggle the bookmark status of a book (add or remove). |

***

#### 💬 Comment Routes

Enable users to interact with books by leaving comments and replies.

| Method | Route | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/comments/:bookId` | Get all comments for a specific book. | None |
| `POST` | `/api/v1/comments/:bookId` | Add a new comment to a specific book. | `verifyJWT` |
| `GET` | `/api/v1/comments/:commentId/replies` | Get all replies for a specific comment. | None |
| `DELETE` | `/api/v1/comments/:commentId` | Delete a specific comment. | `verifyJWT` |
| `PATCH` | `/api/v1/comments/:commentId` | Update the content of a specific comment. | `verifyJWT` |

***

#### 🛒 Purchase Routes

Handle book purchasing and track user purchases.

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/purchases` | Get all books purchased by the current user. |
| `POST` | `/api/v1/purchases` | Initiate and complete a book purchase transaction (Stripe integration). |

***

#### 💰 Seller Routes

Dedicated routes for seller account management and Stripe integration.

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/seller/account` | Create or link a Stripe Connect account for the seller. |
| `POST` | `/api/v1/seller/account-link` | Generate a URL for the seller to complete their Stripe account setup. |
| `POST` | `/api/v1/seller/dashboard-link` | Generate a login URL for the seller to access their Stripe dashboard. |

***

#### 👤 User Routes (Authentication and Profile)

Core user authentication and profile management.

| Method | Route | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | Register a new user account. | None |
| `POST` | `/api/v1/users/login` | Log in a user and issue access and refresh tokens. | None |
| **Secure Routes** |
| `POST` | `/api/v1/users/logout` | Log out the user by clearing tokens. | `verifyJWT` |
| `POST` | `/api/v1/users/refresh-token` | Generate a new access token using the refresh token. | None |
| `GET` | `/api/v1/users/current-user` | Get the details of the currently logged-in user. | `verifyJWT` |
| `PATCH` | `/api/v1/users/change-password` | Change the user's password. | `verifyJWT` |
| `PATCH` | `/api/v1/users/change-email` | Change the user's email address. | `verifyJWT` |
| `PATCH` | `/api/v1/users/update-profile` | Update user profile details (e.g., name, bio). | `verifyJWT` |
| `DELETE` | `/api/v1/users/delete-account` | Permanently delete the user's account. | `verifyJWT` |
| `PATCH` | `/api/v1/users/avatar` | Update the user's profile avatar. | `verifyJWT`, `upload.single` |
| `PATCH` | `/api/v1/users/cover-image` | Update the user's profile cover image. | `verifyJWT`, `upload.single` |
| `DELETE` | `/api/v1/users/:type` | Delete the user's avatar or cover image (`:type` is 'avatar' or 'cover-image'). | `verifyJWT` |

***

---
---

## Testing 


---

### ✅ User Routes Test Checklist

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

### ✅ Book Routes Test Checklist

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

### Comment Routes Test Checklist

| Method | Endpoint                              | Auth Required | Description                                       | Tested |
| ------ | ------------------------------------- | ------------- | ------------------------------------------------- | ------ |
| GET    | `/api/v1/comments/book/:bookId`       | ❌ No          | Get all top-level comments for a book (paginated) | ✅      |
| POST   | `/api/v1/comments/book/:bookId`       | ✅ Yes         | Add a new comment to a book                       | ✅      |
| GET    | `/api/v1/comments/:commentId/replies` | ❌ No          | Get all replies for a specific comment            | ✅      |
| PATCH  | `/api/v1/comments/:commentId`         | ✅ Yes         | Update a comment (only by the owner)              | ✅      |
| DELETE | `/api/v1/comments/:commentId`         | ✅ Yes         | Delete a comment (only by the owner)              | ✅      |

---

### Bookmark Routes Test Checklist

| Method | Endpoint                              | Auth Required | Description                                       | Tested |
| ------ | ------------------------------------- | ------------- | ------------------------------------------------- | ------ |
| GET    | `/api/v1/bookmark/`       | ✅ Yes          | get bookmarks (paginated) | ✅      |
| POST   | `/api/v1/bookmark/:bookId`       | ✅ Yes         | toggle bookmark                       | ✅      |
---


### Bookmark Routes Test Checklist

| Method | Endpoint                              | Auth Required | Description                                       | Tested |
| ------ | ------------------------------------- | ------------- | ------------------------------------------------- | ------ |
| GET    | `/api/v1/bookmark/`       | ✅ Yes          | get bookmarks (paginated) | ✅      |
| POST   | `/api/v1/bookmark/:bookId`       | ✅ Yes         | toggle bookmark                       | ✅      |
---
