# ComputeBay Authentication Service — API Route Reference

This document provides a comprehensive specification of all endpoints exposed by the **ComputeBay Auth Service** (`/api/v1`). It outlines request methods, endpoints, required headers, authentication levels, input validations (using Zod schemas), and detailed response structures.

---

## Global Specifications

### Base URL
All API routes are prefixed with:
```
/api/v1
```

### Standard Headers
| Header | Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required for all `POST`, `PUT`, `PATCH` requests. |
| `Authorization` | `Bearer <JWT_ACCESS_TOKEN>` | Required for authenticated routes. |
| `x-request-id` | `string` (Optional) | Client-side generated request UUID for tracing and logging. |

### Standard JSON Response Envelope
All application responses (except redirects and static text) adhere to a unified JSON structure:

#### Success Response Structure
```json
{
  "success": true,
  "message": "Operation description string",
  "data": {
    // Response payload (object, array, or null)
  },
  "error": null,
  "meta": {
    "version": "v1",
    "timestamp": "2026-05-25T07:15:00.000Z",
    "requestId": "uuid-or-null"
  }
}
```

#### Error Response Structure
```json
{
  "success": false,
  "message": "User-friendly error description message",
  "data": null,
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": "Technical breakdown or array of validation errors"
  },
  "meta": {
    "version": "v1",
    "timestamp": "2026-05-25T07:15:00.000Z",
    "requestId": "uuid-or-null"
  }
}
```

#### Common Error Codes
* `USER_EXISTS`: An account with the provided email already exists.
* `INVALID_CREDENTIALS`: Password or email mismatch, or account type mismatch.
* `INVALID_REFRESH_TOKEN`: The provided refresh token is syntactically invalid or not found.
* `TOKEN_REVOKED`: The refresh token has been invalidated (e.g., after password resets or logouts).
* `TOKEN_EXPIRED`: The refresh token lifetime has expired.
* `INVALID_OTP` / `OTP_EXPIRED`: The entered OTP code is incorrect or past its expiration window.
* `TOO_MANY_ATTEMPTS`: Too many failed verification attempts (limits to 5).
* `FORBIDDEN`: The user does not have permissions to perform this action.
* `ORG_NOT_FOUND`: The organization ID specified does not exist.
* `USER_NOT_FOUND`: The user ID specified does not exist.
* `INTERNAL_ERROR`: Uncaught/unexpected server exception.

---

## 1. Authentication & OAuth Routes (`/api/v1/auth`)

### 1.1 Base Auth Check
Checks if the authentication routing and controller layer are functional.
* **Method:** `GET`
* **Path:** `/auth`
* **Auth:** Public
* **Request Headers:** None
* **Request Body:** None
* **Response Body (Text):**
  ```
  auth api is up
  ```

---

### 1.2 User Registration
Registers a new user account, creates a default organization for them, and assigns them the `OWNER` role inside that organization.
* **Method:** `POST`
* **Path:** `/auth/register`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@computebay.com",
    "password": "securepassword123",
    "name": "Jane Doe",
    "phone": "+15555551234",
    "accountType": "DEVELOPER"
  }
  ```
  * **Validation Rules:**
    * `email`: String, must be a valid email format.
    * `password`: String, minimum 8 characters.
    * `name`: String, optional.
    * `phone`: String, optional.
    * `accountType`: Enum, must be either `"DEVELOPER"` or `"CONTRIBUTOR"`.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
        "email": "developer@computebay.com",
        "name": "Jane Doe"
      },
      "org": {
        "id": "3be93c3b-d779-455b-80df-0bfa7d6b4129",
        "role": "OWNER"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlOWVmNjk0Zi0xMjQ5LTQzYzMtOGZkZS1iNTY1YTA0ZWEyOWQiLCJvcmdJZCI6IjNiZTkzYzNiLWQ3NzktNDU1Yi04MGRmLTBiZmE3ZDZiNDEyOSIsInJvbGUiOiJPV05FUiIsImFjY291bnRUeXBlIjoiREVWRUxPUEVSIiwiaWF0IjoxNzEzODg4MDAwLCJleHAiOjE3MTM4OTIwMDB9.signature",
      "refreshToken": "708940026e64c679a95781a76c8c4a48ff980ea238e88e89f816040cb25f54ee"
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.3 Local Login
Authenticates a user using email and password, returning an access token and a rotating refresh token.
* **Method:** `POST`
* **Path:** `/auth/login`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@computebay.com",
    "password": "securepassword123",
    "accountType": "DEVELOPER"
  }
  ```
  * **Validation Rules:**
    * `email`: String, required.
    * `password`: String, minimum 8 characters.
    * `accountType`: Enum, optional (`"DEVELOPER"` or `"CONTRIBUTOR"`). If supplied, authentication validates against this account type.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User login successfully",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "9a7f05326c59d9c287c6b541ae203cd84ff128aa..."
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.4 Refresh Access Token
Rotates the refresh token and yields a new short-lived access JWT token to avoid session expiration.
* **Method:** `POST`
* **Path:** `/auth/refresh`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "refreshToken": "9a7f05326c59d9c287c6b541ae203cd84ff128aa..."
  }
  ```
  * **Validation Rules:**
    * `refreshToken`: String, minimum 1 character.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Token refreshed",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "8bc129aa24fb879e6022839caee4205561aae..."
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.5 User Logout
Revokes the provided refresh token, invalidating future session refreshes for this device.
* **Method:** `POST`
* **Path:** `/auth/logout`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "refreshToken": "8bc129aa24fb879e6022839caee4205561aae..."
  }
  ```
  * **Validation Rules:**
    * `refreshToken`: String, minimum 1 character.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User logged out",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.6 Forgot Password
Triggers a password recovery flow. Generates and hashes a 6-digit verification code, and issues it to the specified email using the external Notification Service.
* **Method:** `POST`
* **Path:** `/auth/forgot-password`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@computebay.com"
  }
  ```
  * **Validation Rules:**
    * `email`: String, must be a valid email format.
* **Response Body (`200 OK`):**
  *(Note: A generic success message is always returned for security, regardless of whether the email exists in the database.)*
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, you will receive an OTP",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.7 Verify OTP
Verifies the valid OTP code received during multi-factor authentication or generic operations.
* **Method:** `POST`
* **Path:** `/auth/verify-otp`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@computebay.com",
    "code": "847291",
    "type": "EMAIL_VERIFICATION"
  }
  ```
  * **Validation Rules:**
    * `email`: String, valid email format.
    * `code`: String, 4 to 6 characters.
    * `type`: Enum, must be either `"EMAIL_VERIFICATION"` or `"PHONE_VERIFICATION"`.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "data": {
      "message": "OTP verified successfully",
      "verified": true
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.8 Reset Password
Resets the password of the account using a valid, unused OTP code. Once completed, all previously active sessions (refresh tokens) are automatically revoked.
* **Method:** `POST`
* **Path:** `/auth/reset-password`
* **Auth:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "developer@computebay.com",
    "otp": "847291",
    "newPassword": "super_secure_new_password_2026"
  }
  ```
  * **Validation Rules:**
    * `email`: String, valid email format.
    * `otp`: String, 4 to 6 characters.
    * `newPassword`: String, required.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Password reset successful",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.9 Get Current User Session Info
Fetches profile information and organization membership details for the currently active authenticated session.
* **Method:** `GET`
* **Path:** `/auth/me`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "",
    "data": {
      "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "email": "developer@computebay.com",
      "name": "Jane Doe",
      "phone": "+15555551234",
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "createdAt": "2026-05-25T07:14:00.000Z",
      "memberships": [
        {
          "org": {
            "id": "3be93c3b-d779-455b-80df-0bfa7d6b4129",
            "name": "developer@computebay.com's org"
          },
          "role": "OWNER"
        }
      ]
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 1.10 Initiate OAuth Authorization
Redirects the user agent to the external provider's login/consent screen (supports Google and GitHub).
* **Method:** `GET`
* **Path:** `/auth/oauth/:provider`
* **Auth:** Public
* **URL Parameters:**
  * `:provider`: Must be either `google` or `github`.
* **Query Parameters:**
  * `accountType`: (Optional) `"DEVELOPER"` or `"CONTRIBUTOR"`.
* **Response:**
  * Status code `302 Found` with `Location` header redirecting to Google/GitHub authentication page.

---

### 1.11 OAuth Callback
The endpoint hit by the external OAuth provider after user authorization. Redirects back to the frontend dashboard with parsed access and refresh tokens.
* **Method:** `GET`
* **Path:** `/auth/oauth/:provider/callback`
* **Auth:** Public
* **URL Parameters:**
  * `:provider`: Must be `google` or `github`.
* **Query Parameters:**
  * `code`: Authentication grant code.
  * `state`: State parameter containing CSRF token and `accountType`.
* **Response:**
  * Status code `302 Found` with `Location` header directing to:
    ```
    ${FRONTEND_URL}/oauth/callback?accessToken=<token>&refreshToken=<token>
    ```

---

## 2. Health Check (`/api/v1/health`)

### 2.1 Get System Health
Retrieves current service uptime, active status, and timestamp.
* **Method:** `GET`
* **Path:** `/health`
* **Auth:** Public
* **Request Body:** None
* **Response Body (`200 OK`):**
  ```json
  {
    "status": "OK",
    "uptime": 139.845,
    "service": "Auth Service",
    "timestamp": "2026-05-25T07:15:00.000Z"
  }
  ```

---

## 3. User Administration Routes (`/api/v1/users`)

### 3.1 Base Users Route Check
Validates that the users endpoint matches correctly.
* **Method:** `GET`
* **Path:** `/users`
* **Auth:** Public
* **Request Body:** None
* **Response Body (Text):**
  ```
  user api is up
  ```

---

### 3.2 List All Users
Retrieves a complete list of users registered within the service. Restrictive access to administration accounts.
* **Method:** `GET`
* **Path:** `/users/all`
* **Auth:** Bearer Token Required (Only `ADMIN` or `OWNER` role inside their respective memberships)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
        "email": "developer@computebay.com",
        "name": "Jane Doe",
        "phone": "+15555551234",
        "isEmailVerified": true,
        "isPhoneVerified": false,
        "createdAt": "2026-05-25T07:14:00.000Z",
        "memberships": [
          {
            "org": {
              "id": "3be93c3b-d779-455b-80df-0bfa7d6b4129",
              "name": "developer@computebay.com's org"
            },
            "role": "OWNER"
          }
        ]
      }
    ],
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 3.3 Get Specific User Profile by ID
Fetches profile information of a targeted user.
* **Method:** `GET`
* **Path:** `/users/:userId`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:userId`: UUID of the target user.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "User retrieved successfully",
    "data": {
      "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "email": "developer@computebay.com",
      "name": "Jane Doe",
      "phone": "+15555551234",
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "createdAt": "2026-05-25T07:14:00.000Z",
      "memberships": [
        {
          "org": {
            "id": "3be93c3b-d779-455b-80df-0bfa7d6b4129",
            "name": "developer@computebay.com's org"
          },
          "role": "OWNER"
        }
      ]
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 3.4 Update Current User Profile
Modifies profile fields (name and/or phone number) for the authenticated session owner.
* **Method:** `PATCH`
* **Path:** `/users/me`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Request Body (JSON):**
  ```json
  {
    "name": "Jane Doe (Updated)",
    "phone": "+15555559999"
  }
  ```
  * **Validation Rules:**
    * `name`: String, optional.
    * `phone`: String, optional.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "email": "developer@computebay.com",
      "name": "Jane Doe (Updated)",
      "phone": "+15555559999",
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "createdAt": "2026-05-25T07:14:00.000Z"
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 3.5 Delete Current User Account
Permanently deletes the currently authenticated user's account and cascades removal to their credentials, profiles, refresh tokens, and other database relations.
* **Method:** `DELETE`
* **Path:** `/users/me`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "User deleted successfully",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

## 4. Organization Administration Routes (`/api/v1/orgs`)

### 4.1 Base Orgs Route Check
Validates that the orgs route prefix resolves correctly.
* **Method:** `GET`
* **Path:** `/orgs`
* **Auth:** Public
* **Request Body:** None
* **Response Body (Text):**
  ```
  org api is up
  ```

---

### 4.2 Create New Organization
Creates a new organization record in the database. The creator user is automatically linked to the organization with the `OWNER` role.
* **Method:** `POST`
* **Path:** `/orgs`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Request Body (JSON):**
  ```json
  {
    "name": "ComputeBay Tech LLC"
  }
  ```
  * **Validation Rules:**
    * `name`: String, required.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Organization created successfully",
    "data": {
      "id": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
      "name": "ComputeBay Tech LLC",
      "ownerId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "createdAt": "2026-05-25T07:15:00.000Z"
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.3 Get User's Organizations (Mine)
Retrieves a complete list of organization memberships for the authenticated user session.
* **Method:** `GET`
* **Path:** `/orgs/list/mine`
* **Auth:** Bearer Token Required
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Organizations retrieved successfully",
    "data": [
      {
        "id": "77494aa2-8a9d-47be-a5e2-632da84a9ae9",
        "userId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
        "orgId": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
        "role": "OWNER",
        "org": {
          "id": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
          "name": "ComputeBay Tech LLC",
          "createdAt": "2026-05-25T07:15:00.000Z"
        }
      }
    ],
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.4 Get Organization by ID
Fetches core details of a targeted organization along with its member registry profiles.
* **Method:** `GET`
* **Path:** `/orgs/:orgId`
* **Auth:** Public / Internal (ID-based matching)
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Organization retrieved successfully",
    "data": {
      "id": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
      "name": "ComputeBay Tech LLC",
      "ownerId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "createdAt": "2026-05-25T07:15:00.000Z",
      "memberships": [
        {
          "id": "77494aa2-8a9d-47be-a5e2-632da84a9ae9",
          "userId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
          "role": "OWNER",
          "user": {
            "id": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
            "email": "developer@computebay.com",
            "name": "Jane Doe"
          }
        }
      ]
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.5 Update Organization Details
Modifies an organization's properties (e.g. name).
* **Method:** `PATCH`
* **Path:** `/orgs/:orgId`
* **Auth:** Bearer Token Required (Must be the creator/`ownerId` of the organization)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
* **Request Body (JSON):**
  ```json
  {
    "name": "ComputeBay Enterprises Inc."
  }
  ```
  * **Validation Rules:**
    * `name`: String, optional.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Organization updated successfully",
    "data": {
      "id": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
      "name": "ComputeBay Enterprises Inc.",
      "ownerId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
      "createdAt": "2026-05-25T07:15:00.000Z",
      "memberships": [
        {
          "id": "77494aa2-8a9d-47be-a5e2-632da84a9ae9",
          "userId": "e9ef694f-1249-43c3-8fde-b565a04ea29d",
          "role": "OWNER"
        }
      ]
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.6 Delete Organization
Deletes the specified organization record and cascadingly sweeps its memberships.
* **Method:** `DELETE`
* **Path:** `/orgs/:orgId`
* **Auth:** Bearer Token Required (Must be the creator/`ownerId` of the organization)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Organization deleted successfully",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.7 Add Member to Organization
Associates an existing registered user with the organization under a targeted role.
* **Method:** `POST`
* **Path:** `/orgs/:orgId/members`
* **Auth:** Bearer Token Required (Must be the creator/`ownerId` of the organization)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
* **Request Body (JSON):**
  ```json
  {
    "userId": "d7b42022-861f-44e2-b91c-843de5842880",
    "role": "ADMIN"
  }
  ```
  * **Validation Rules:**
    * `userId`: UUID string, required.
    * `role`: Enum, must be either `"OWNER"`, `"ADMIN"`, or `"USER"`.
* **Response Body (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Member added successfully",
    "data": {
      "id": "1c7a8849-d7b3-469b-9c88-ee2b5cc8a101",
      "userId": "d7b42022-861f-44e2-b91c-843de5842880",
      "orgId": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
      "role": "ADMIN"
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.8 Remove Member from Organization
Disassociates an existing member from the organization database registry.
* **Method:** `DELETE`
* **Path:** `/orgs/:orgId/members/:memberId`
* **Auth:** Bearer Token Required (Must be the creator/`ownerId` of the organization. The organization owner cannot be removed.)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
  * `:memberId`: UUID of the user member to delete.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Member removed successfully",
    "data": null,
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```

---

### 4.9 Update Member Role
Modifies the membership tier (role) of a user inside the organization workspace.
* **Method:** `PATCH`
* **Path:** `/orgs/:orgId/members/:memberId`
* **Auth:** Bearer Token Required (Must be the creator/`ownerId` of the organization. The owner's role cannot be updated/downgraded.)
* **Request Headers:**
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **URL Parameters:**
  * `:orgId`: UUID of the organization.
  * `:memberId`: UUID of the member to update.
* **Request Body (JSON):**
  ```json
  {
    "role": "USER"
  }
  ```
  * **Validation Rules:**
    * `role`: Enum, must be either `"OWNER"`, `"ADMIN"`, or `"USER"`.
* **Response Body (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Member role updated successfully",
    "data": {
      "id": "1c7a8849-d7b3-469b-9c88-ee2b5cc8a101",
      "userId": "d7b42022-861f-44e2-b91c-843de5842880",
      "orgId": "7ac159ef-6d33-4f99-8ab1-2cc5e2e8fb7a",
      "role": "USER"
    },
    "error": null,
    "meta": {
      "version": "v1",
      "timestamp": "2026-05-25T07:15:00.000Z",
      "requestId": null
    }
  }
  ```
