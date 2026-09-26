# Agile Project Plan: Grant Management Portal

## Overview
The Grant Management Portal is a secure, multi-user web application that enables organizations to publish grant opportunities and applicants to submit funding proposals. The system implements Role-Based Access Control (RBAC), OAuth 2.0 authentication, and a containerized Model-View-Controller (MVC) backend architecture.

---

## Epics & User Stories

### Epic 1: User Authentication & OAuth 2.0 Integration

#### User Story 1: Local & OAuth Authentication
**As a** new or returning user  
**I want to** register and sign in using email/password or a third-party OAuth 2.0 provider (e.g., Google)  
**So that** I can securely access portal features with standard JWT-based authorization  

**Acceptance Criteria:**
1. `POST /api/auth/register` creates a new user account with hashed password and default `GRANTEE` role, returning user profile data without password.
2. `POST /api/auth/login` verifies user credentials and returns a signed JSON Web Token (JWT) containing `userId` and `roles`.
3. `GET /api/auth/provider/callback` exchanges authorization codes with third-party OAuth providers, automatically provisions users if necessary, and issues a valid JWT.

---

### Epic 2: Role-Based Access Control (RBAC) & Administration

#### User Story 2: Role Assignment & Access Enforcement
**As an** ADMIN user  
**I want to** assign roles (ADMIN, GRANTOR, GRANTEE) to registered users  
**So that** permission levels can be managed dynamically across the portal  

**Acceptance Criteria:**
1. `POST /api/users/{userId}/roles` is accessible exclusively to authenticated users possessing the `ADMIN` role.
2. Accessing protected endpoints without a valid JWT returns HTTP 401 Unauthorized; accessing endpoints without the required role returns HTTP 403 Forbidden.
3. Updating a user's role immediately modifies `user_roles` in the database and is reflected in newly issued JWT tokens.

---

### Epic 3: Grant Management

#### User Story 3: Creation and Ownership of Grant Opportunities
**As a** GRANTOR  
**I want to** create, update, and delete funding opportunities that I own  
**So that** I can offer grants to qualified applicants while retaining administrative control  

**Acceptance Criteria:**
1. `POST /api/grants` enables users with the `GRANTOR` role to create new grant opportunities with title, description, and amount.
2. `PUT /api/grants/{grantId}` permits updates only if the requesting user is the `GRANTOR` who created the grant; requests from other GRANTORs return HTTP 403 Forbidden.
3. `DELETE /api/grants/{grantId}` allows deletion by the grant owner or an `ADMIN` user.

---

### Epic 4: Application Submission & Evaluation

#### User Story 4: Proposal Submission and Grantor Review
**As a** GRANTEE (or GRANTOR)  
**I want to** submit grant applications as a GRANTEE and review submitted proposals as a GRANTOR  
**So that** funding decisions can be executed efficiently and securely  

**Acceptance Criteria:**
1. `POST /api/grants/{grantId}/apply` allows users with the `GRANTEE` role to submit funding proposals for published grants.
2. `GET /api/grants/{grantId}/applications` lists all submitted applications for a grant, restricted exclusively to the `GRANTOR` who created the parent grant.
3. `GET /api/applications/{appId}` allows proposal details to be viewed only by the submitting `GRANTEE` or the parent grant's `GRANTOR`.
