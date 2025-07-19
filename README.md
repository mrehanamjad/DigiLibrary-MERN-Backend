# DigiLibrary-backend-node-express
DigiLibrary-backend in node express typescript



## ✅ User Routes Test Checklist

| Method | Endpoint                     | Middleware           | Description                    | Tested |
|--------|------------------------------|-----------------------|--------------------------------|--------|
| POST   | /api/v1/users/register       | –                     | Register a new user            | ✅     |
| POST   | /api/v1/users/login          | –                     | Login a user                   | ✅     |
| POST   | /api/v1/users/logout         | verifyJWT             | Logout the current user        | ✅     |
| POST   | /api/v1/users/refresh-token  | –                     | Refresh access token           | ✅     |
| GET    | /api/v1/users/current-user   | verifyJWT             | Get current logged-in user     | ✅     |
| PATCH  | /api/v1/users/change-password| verifyJWT             | Change user password           | ✅     |
| PATCH  | /api/v1/users/change-email   | verifyJWT             | Change user email              | ✅     |
| PATCH  | /api/v1/users/update-profile | verifyJWT             | Update profile info            | ✅     |
| DELETE | /api/v1/users/delete-account | verifyJWT             | Delete user account            | ✅     |
| PATCH  | /api/v1/users/avatar         | verifyJWT, multer     | Update avatar image            | ✅     |
| PATCH  | /api/v1/users/cover-image    | verifyJWT, multer     | Update cover image             | ✅     |
| DELETE | /api/v1/users/:type          | verifyJWT             | Delete avatar/cover image      | ✅     |
