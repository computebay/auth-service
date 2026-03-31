# ComputeBay Auth Service API Documentation

This document describes a production grade authentication microservice designed to handle large user requests and maintain tight security.

## Base URL
Assuming the service routes are prefixed with `/api/v1`, all endpoints listed below will stem from that base.

## Standard Response Format
All endpoints return a standardized JSON structure:

```json
{
  "success": true | false,
  "message": "string (Description of operation result)",
  "data": <object | array | null> (The requested payload or result),
  "error": { "code": "string", "details": "any" } | null,
  "meta": {
    "version": "v1",
    "timestamp": "2026-03-30T15:35:00.000Z",
    "requestId": "string | null"
  }
}
```

---

## 1. Authentication Routes (`/api/v1/auth`)

### 1.1 Register
- **Route:** `POST /register`
- **Auth:** Public
- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123", // Min 8 characters
    "name": "John Doe",              // Optional
    "phone": "+1234567890",          // Optional
    "accountType": "DEVELOPER"       // Enum: "DEVELOPER", "CONTRIBUTOR"
  }
  ```

### 1.2 Login
- **Route:** `POST /login`
- **Auth:** Public
- **Description:** Authenticates a user with email and password.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "accountType": "DEVELOPER"       // Optional mapping Enum: "DEVELOPER", "CONTRIBUTOR"
  }
  ```

### 1.3 Refresh Token
- **Route:** `POST /refresh`
- **Auth:** Public
- **Description:** Exchanges a refresh token for a new set of access/refresh tokens.
- **Request Body:**
  ```json
  {
    "refreshToken": "your_refresh_token_string"
  }
  ```

### 1.4 Logout
- **Route:** `POST /logout`
- **Auth:** Public
- **Description:** Invalidates the provided refresh token.
- **Request Body:**
  ```json
  {
    "refreshToken": "your_refresh_token_string"
  }
  ```

### 1.5 Forgot Password
- **Route:** `POST /forgot-password`
- **Auth:** Public
- **Description:** Initiates a password reset flow by sending an OTP to the user's email.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 1.6 Verify OTP
- **Route:** `POST /verify-otp`
- **Auth:** Public
- **Description:** Verifies an OTP code across email/phone.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "code": "123456",             // Length: 4 to 6 characters
    "type": "EMAIL_VERIFICATION"  // Enum: "EMAIL_VERIFICATION", "PHONE_VERIFICATION"
  }
  ```

### 1.7 Reset Password
- **Route:** `POST /reset-password`
- **Auth:** Public
- **Description:** Resets the password using a valid OTP code.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",              // Length: 4 to 6 characters
    "newPassword": "newstrongpassword123"
  }
  ```

### 1.8 Get Current Session User
- **Route:** `GET /me`
- **Auth:** Bearer Token Required
- **Description:** Gets details of the currently authenticated user.

### 1.9 OAuth Login / Callback
- **Initiate:** `GET /oauth/:provider` (Providers e.g., `google`, `github`)
- **Callback:** `GET /oauth/:provider/callback`
- **Description:** Used to hand off authentication to external OAuth providers.

---

## 2. User Routes (`/api/v1/users`)

### 2.1 Get All Users
- **Route:** `GET /all`
- **Auth:** Bearer Token Required (Role: `ADMIN` or `OWNER`)
- **Description:** Retrieves a list of all users in the system.

### 2.2 Get User by ID
- **Route:** `GET /:userId`
- **Auth:** Bearer Token Required
- **Description:** Target a specific user's public profile or metadata.

### 2.3 Update Current User Profile
- **Route:** `PATCH /me`
- **Auth:** Bearer Token Required
- **Description:** Updates self-profile info.
- **Request Body:**
  ```json
  {
    "name": "New Name",     // Optional
    "phone": "New Phone"    // Optional
  }
  ```

### 2.4 Delete Current User
- **Route:** `DELETE /me`
- **Auth:** Bearer Token Required
- **Description:** Deletes the authenticated user's account permanently.

---

## 3. Organization Routes (`/api/v1/orgs`)

### 3.1 Create Organization
- **Route:** `POST /`
- **Auth:** Bearer Token Required
- **Description:** Creates a new organization.
- **Request Body:**
  ```json
  {
    "name": "My New Startup"
  }
  ```

### 3.2 List User's Organizations
- **Route:** `GET /list/mine`
- **Auth:** Bearer Token Required
- **Description:** Lists all organizations that the current authenticated user belongs to.

### 3.3 Get Organization
- **Route:** `GET /:orgId`
- **Auth:** Public/Internal (ID Based)
- **Description:** Fetches details of a specific organization.

### 3.4 Update Organization
- **Route:** `PATCH /:orgId`
- **Auth:** Bearer Token Required (must be Org Owner/Admin)
- **Description:** Updates details of an organization.
- **Request Body:**
  ```json
  {
    "name": "Updated Org Name"   // Optional
  }
  ```

### 3.5 Delete Organization
- **Route:** `DELETE /:orgId`
- **Auth:** Bearer Token Required (must be Org Owner)
- **Description:** Deletes the target organization.

### 3.6 Add Member to Organization
- **Route:** `POST /:orgId/members`
- **Auth:** Bearer Token Required
- **Description:** Add a user to the organization.
- **Request Body:**
  ```json
  {
    "userId": "uuid-of-user",
    "role": "ADMIN" // e.g. "MEMBER", "ADMIN" based on enums
  }
  ```

### 3.7 Remove Member from Organization
- **Route:** `DELETE /:orgId/members/:memberId`
- **Auth:** Bearer Token Required
- **Description:** Removes a member from an organization.

### 3.8 Update Member Role
- **Route:** `PATCH /:orgId/members/:memberId`
- **Auth:** Bearer Token Required
- **Description:** Updates the role of a user inside the organization.
- **Request Body:**
  ```json
  {
    "role": "OWNER" // Promotes/demotes role
  }
  ```
