# AWS IAM Inspired Self-Administered Authorization System

## Project Description

The AWS IAM Inspired Self-Administered Authorization System is a full-stack web application designed to mimic the core behavior of cloud-based Identity and Access Management (IAM) systems, specifically modeled after Amazon Web Services (AWS) IAM. 

This project was built to demonstrate a robust, scalable, and highly secure access control system where users, groups, managed policies, inline policies, and permission boundaries interoperate. It uses a self-administered model, meaning the IAM engine not only protects organizational resources (like reports and alerts) but also protects its own management APIs using the exact same middleware. 

The objective of the assessment was to implement a rigorous, deterministic permission evaluation algorithm where an Explicit Deny always overrides an Allow, implicit deny is the default, boundaries act as absolute permission caps, and privilege escalation is prevented via delegation bypass prevention.

## Features

**Authentication**
* Register, Login, and Logout functionality using JWT.
* Current User session management.
* Secure password hashing using bcrypt.

**IAM (Identity and Access Management)**
* **Users & Groups:** Create, list, and manage users and groups.
* **Managed Policies:** Reusable JSON documents defining allowed or denied actions.
* **Inline Policies:** Tightly coupled policies bound to a specific user or group.
* **Group Membership:** Easily scale access by assigning policies to groups.
* **Direct User Policies:** Fine-grained identity-based policies.
* **Permission Boundaries:** Hard caps on user permissions, manageable only by the Root user.
* **Effective Permission Summary:** Real-time computation of a user's exact allowed/denied actions.
* **Delegation Bypass Prevention:** Prevents users from granting permissions they don't possess.
* **Root User:** A superuser account that bypasses all IAM checks.
* **IAM Middleware:** A single, robust, reusable middleware protecting all routes.
* **Resource Authorization:** Dummy backend routes (reports, alerts, audit, settings) proving the engine's validity.

**Frontend / Dashboard**
* Interactive Resource Dashboard to test real-time access.
* Advanced Policy Builder with dropdowns, toggles, and live JSON preview (No raw JSON typing needed).
* AWS-style Policy Attachments for users and groups.
* Detailed Users and Groups management pages.
* Fully responsive and accessible UI using Tailwind CSS and shadcn/ui.
* Real-time server state management via TanStack Query.
* Toast Notifications for seamless UX.

## AWS IAM Concepts Implemented

* **User:** An individual identity within the organization. Users can belong to groups and have policies attached directly to them.
* **Group:** A collection of users. Policies attached to a group are inherited by all its members, simplifying administration.
* **Managed Policy:** A standalone, reusable permission document that can be attached to multiple users and groups.
* **Inline Policy:** A permission document strictly bound to a single user or group. It is deleted when the parent entity is deleted.
* **Identity Policy:** Any policy (managed or inline) directly attached to a user.
* **Permission Boundary:** A managed policy set on a user that acts as a hard ceiling on their permissions. It does *not* grant access, it only limits the maximum access a user can have.
* **Effective Permissions:** The final computed set of permissions after evaluating all group policies, identity policies, and boundaries.
* **Explicit Deny:** A statement explicitly blocking an action. This always takes absolute precedence over any allow.
* **Implicit Deny:** If an action is not explicitly allowed, it is denied by default.
* **Delegation Bypass Prevention:** A security mechanism preventing users from creating or assigning policies that grant permissions they do not currently hold themselves.
* **Root User:** An administrative bypass user that is not subject to IAM restrictions and cannot be modified or deleted by others.

## IAM Permission Evaluation Flow

The backend employs a strict, step-by-step algorithm to evaluate every protected request.

```mermaid
flowchart TD
    Start[Incoming Request] --> AuthCheck{Authenticated?}
    AuthCheck -- No --> 401[Return 401 Unauthorized]
    AuthCheck -- Yes --> RootCheck{Is Root User?}
    RootCheck -- Yes --> Allow[Proceed / 200 OK]
    RootCheck -- No --> Collect[Collect Identity & Group Policies]
    
    Collect --> Merge[Merge All Policy Statements]
    
    Merge --> DenyCheck{Explicit Deny?}
    DenyCheck -- Yes --> Deny[Return 403 Access Denied]
    
    DenyCheck -- No --> AllowCheck{Explicit Allow?}
    AllowCheck -- No --> DenyImplicit[Return 403 Implicit Deny]
    
    AllowCheck -- Yes --> BoundCheck{Has Boundary?}
    BoundCheck -- No --> Allow
    
    BoundCheck -- Yes --> BoundAllowCheck{Boundary Allows?}
    BoundAllowCheck -- Yes --> Allow
    BoundAllowCheck -- No --> DenyBound[Return 403 Boundary Deny]
```

1. **Authentication:** User must possess a valid JWT.
2. **Root Check:** Root always proceeds.
3. **Collection:** All attached identity and group policies are gathered into a flat list of statements.
4. **Explicit Deny (The Hammer):** If *any* statement denies the requested action, access is immediately blocked.
5. **Explicit Allow (The Key):** If there is no allow statement for the action, access is blocked (implicit deny).
6. **Boundary Check (The Ceiling):** If a boundary exists, it *must* also contain an explicit allow for the action. If not, access is blocked.

## Backend Architecture

The backend follows a clean, layered architectural pattern to enforce separation of concerns:

```mermaid
flowchart TD
    Router[Express Routes] --> Middleware[IAM / Validation Middleware]
    Middleware --> Controllers[Controllers]
    Controllers --> Services[Business Services]
    Services --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]
```

* **Routes:** Define the API endpoints and attach middlewares.
* **Middlewares:** Handle JWT validation (`authMiddleware`), input validation (Zod schemas), and the core IAM engine (`authorize`).
* **Controllers:** Extract data from requests and formulate HTTP responses.
* **Services:** Contain the core business logic (e.g., verifying delegation bypass, computing effective permissions).
* **Prisma (Data Access):** Typesafe ORM interacting with the PostgreSQL database.

## Frontend Architecture

The frontend is a modern React application utilizing Vite for rapid development.

* **React + Vite:** Core framework offering lightning-fast HMR and build times.
* **React Router:** Handles client-side navigation and protected routes.
* **TanStack Query:** Manages server state, caching, and background data synchronization.
* **Axios:** Handles HTTP requests and automatically attaches the JWT via interceptors.
* **Tailwind CSS + shadcn/ui:** Provides a robust, highly customizable, and accessible design system.
* **Component Hierarchy:** Separates presentational components from stateful container components. Uses standard layouts to persist sidebars and navigation.
* **Contexts:** React Context is utilized for global authentication state management.

## Folder Structure

```text
/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema definition
│   │   └── seed.ts             # Script to initialize Root, Alice, Bob, etc.
│   ├── src/
│   │   ├── controllers/        # Express route handlers
│   │   ├── middlewares/        # auth, authorize, validate middlewares
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Core business logic
│   │   ├── utils/              # Helper functions (catchAsync, etc.)
│   │   ├── validators/         # Zod schemas for input validation
│   │   └── server.ts           # Entry point
│   ├── .env                    # Backend environment variables
│   └── package.json
│
└── Client/
    ├── src/
    │   ├── api/                # Axios client configuration
    │   ├── assets/             # Static assets
    │   ├── components/         # Reusable UI components (shadcn)
    │   ├── contexts/           # React contexts (AuthContext)
    │   ├── hooks/              # Custom React hooks (React Query integrations)
    │   ├── layouts/            # Page layout components
    │   ├── lib/                # Utility functions (Tailwind merge, etc.)
    │   ├── pages/              # Application views (Dashboard, IAM Console)
    │   ├── App.jsx             # Root component and router
    │   └── main.jsx            # React DOM entry point
    ├── .env                    # Frontend environment variables
    ├── tailwind.config.js      
    └── package.json
```

## Database Design

The PostgreSQL database is fully managed by Prisma. 

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ GROUP : contains
    ORGANIZATION ||--o{ POLICY : contains
    USER ||--o{ USER_GROUP_MEMBERSHIP : has
    GROUP ||--o{ USER_GROUP_MEMBERSHIP : has
    GROUP ||--o{ GROUP_POLICY_ATTACHMENT : has
    POLICY ||--o{ GROUP_POLICY_ATTACHMENT : has
    USER ||--o{ USER_POLICY_ATTACHMENT : has
    POLICY ||--o{ USER_POLICY_ATTACHMENT : has
    USER ||--o| USER_BOUNDARY : has
    POLICY ||--o{ USER_BOUNDARY : has
```

* **Organization:** Multi-tenant support wrapper.
* **User:** Contains authentication details, root flag, and organizational relation.
* **Group:** A named entity that holds members and policies.
* **Policy:** Stores statements as JSON, designated as either MANAGED or INLINE.
* **Join Tables:** `UserGroupMembership`, `GroupPolicyAttachment`, and `UserPolicyAttachment` facilitate many-to-many relationships with cascade deletes.
* **UserBoundary:** A one-to-one relationship enforcing the permission ceiling.

## Technologies Used

**Backend**
* Node.js & Express.js: Runtime and web framework.
* TypeScript: For robust, statically-typed server code.
* Prisma ORM: Next-generation ORM for type-safe database queries.
* PostgreSQL: Robust relational database.
* JWT & bcrypt: Secure authentication and password hashing.
* Zod: Schema validation.

**Frontend**
* React & Vite: Fast, modern UI development.
* Tailwind CSS: Utility-first styling framework.
* shadcn/ui: Accessible, unstyled UI components.
* TanStack Query: Asynchronous state management.
* Axios: Promise-based HTTP client.

## API Documentation

### Authentication (`/api/auth`)
* `POST /register`: Register a new user.
* `POST /login`: Authenticate and receive JWT.
* `POST /logout`: Invalidate session.
* `GET /me`: Retrieve current user profile.

### IAM Administration (`/api/iam`)
* `GET /policies`: List all policies (Requires `iam:ListPolicies`).
* `GET /policies/:id`: Get policy details (Requires `iam:GetPolicy`).
* `POST /policies`: Create policy (Requires `iam:CreatePolicy`).
* `PUT /policies/:id`: Update policy (Requires `iam:UpdatePolicy`).
* `DELETE /policies/:id`: Delete policy (Requires `iam:DeletePolicy`).
* `GET /groups`: List groups (Requires `iam:ListGroups`).
* `GET /groups/:id`: Get group details (Requires `iam:GetGroup`).
* `POST /groups`: Create group (Requires `iam:CreateGroup`).
* `PUT /groups/:id`: Update group (Requires `iam:UpdateGroup`).
* `DELETE /groups/:id`: Delete group (Requires `iam:DeleteGroup`).
* `POST /groups/:id/members`: Add user to group (Requires `iam:AddUserToGroup`).
* `DELETE /groups/:id/members/:userId`: Remove user from group (Requires `iam:RemoveUserFromGroup`).
* `POST /groups/:id/policies`: Attach policy to group (Requires `iam:AttachGroupPolicy`).
* `DELETE /groups/:id/policies/:policyId`: Detach policy from group (Requires `iam:DetachGroupPolicy`).
* `GET /users`: List users (Requires `iam:ListUsers`).
* `GET /users/:id`: Get user profile (Requires `iam:GetUser`).
* `POST /users/:id/policies`: Attach policy to user (Requires `iam:AttachUserPolicy`).
* `DELETE /users/:id/policies/:policyId`: Detach policy from user (Requires `iam:DetachUserPolicy`).
* `PUT /users/:id/boundary`: Set boundary (Requires `iam:PutUserBoundary`, Root Only).
* `DELETE /users/:id/boundary`: Remove boundary (Requires `iam:DeleteUserBoundary`, Root Only).

### Resources (`/api`)
All resource routes are dummy routes returning `{"success": true, "message": "OK"}` upon successful IAM evaluation.
* **Reports:** `GET /reports`, `GET /reports/:id`, `POST /reports`, `PUT /reports/:id`, `DELETE /reports/:id`
* **Alerts:** `GET /alerts`, `GET /alerts/:id`, `POST /alerts`, `PATCH /alerts/:id/acknowledge`, `DELETE /alerts/:id`
* **Settings:** `GET /settings`, `PUT /settings`
* **Audit:** `GET /audit`, `GET /audit/:id`

## IAM Route Protection Matrix

| Route | Required IAM Action | Protected By |
| --- | --- | --- |
| `/api/reports` | `reports:List`, `reports:Create` | IAM Middleware |
| `/api/reports/:id` | `reports:Read`, `reports:Update`, `reports:Delete` | IAM Middleware |
| `/api/alerts` | `alerts:List`, `alerts:Create` | IAM Middleware |
| `/api/alerts/:id` | `alerts:Read`, `alerts:Delete` | IAM Middleware |
| `/api/alerts/:id/acknowledge` | `alerts:Acknowledge` | IAM Middleware |
| `/api/settings` | `settings:Read`, `settings:Update` | IAM Middleware |
| `/api/audit` | `audit:List` | IAM Middleware |
| `/api/audit/:id` | `audit:Read` | IAM Middleware |
| `/api/iam/policies` | `iam:ListPolicies`, `iam:CreatePolicy` | IAM Middleware |
| `/api/iam/groups` | `iam:ListGroups`, `iam:CreateGroup` | IAM Middleware |
| `/api/iam/users` | `iam:ListUsers` | IAM Middleware |

*(All `/api/iam/*` routes are fully protected by their respective `iam:*` actions).*

## Policy Statement Builder

The frontend includes a robust Policy Builder to prevent users from typing raw JSON.
* **Effect:** A clean UI toggle between "Allow" and "Deny".
* **Action:** A searchable, multi-select dropdown containing exclusively valid namespace actions (e.g., `reports:Read`, `iam:CreatePolicy`).
* **Resource:** Safely pre-filled and locked to `["*"]`.
* **JSON Preview:** A real-time updating JSON preview validates the structural output.

```json
{
  "statements": [
    {
      "Effect": "Allow",
      "Action": ["reports:Read", "reports:List"],
      "Resource": ["*"]
    },
    {
      "Effect": "Deny",
      "Action": ["reports:Delete"],
      "Resource": ["*"]
    }
  ]
}
```

## Permission Boundary

A permission boundary is a mechanism to enforce the principle of least privilege.
* **What it is:** A managed policy set specifically as a boundary on a user.
* **How it works:** It never grants permissions; it only limits them. If an identity policy allows `reports:Delete`, but the boundary does not, the effective permission is **Denied**.
* **Root Restriction:** Only the Root user can set, update, or remove a boundary to prevent malicious users from escaping their confines.

## Delegation Bypass Prevention

**The Problem:** Without prevention, a user with `iam:CreatePolicy` could create a policy granting themselves `reports:Delete`, effectively escalating their own privileges.
**The Solution:** Whenever a policy is created, updated, or attached, the backend validates that the requesting user *already possesses* every single `Allow` action contained within the target policy. If they lack even one, the request is rejected with a 403 Forbidden.

## Seed Data

The `prisma/seed.ts` script initializes the database with standard assessment requirements.
* **Root User:** `root@org.local` / `root1234` (Full bypass access)
* **Alice:** `alice@org.local` / `alice1234` (Belongs to "Viewers" group)
* **Bob:** `bob@org.local` / `bob1234` (No initial permissions)
* **Charlie:** `charlie@org.local` / `charlie1234`
* **Default Policies:** `ReadOnlyAccess` and `ReportsFullAccess`.
* **Default Group:** `Viewers` (contains Alice, bound to `ReadOnlyAccess`).

## Environment Variables

**Backend (`Backend/.env`)**
* `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://user:pass@localhost:5432/iam_assessment?schema=public`).
* `JWT_SECRET`: Secret key for signing JSON Web Tokens.
* `JWT_EXPIRES_IN`: Token lifespan (e.g., `15m` or `1d`).
* `PORT`: API server port (default `3000`).

**Frontend (`Client/.env`)**
* `VITE_API_URL`: The base URL for backend API requests (e.g., `http://localhost:3000/api`).

## Local Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL

### Backend Setup
1. `cd Backend`
2. `npm install`
3. Configure `.env` with your `DATABASE_URL`.
4. Run migrations: `npx prisma migrate dev`
5. Generate Prisma Client: `npx prisma generate`
6. Seed database: `npx ts-node prisma/seed.ts`
7. Start server: `npm run dev`

### Frontend Setup
1. `cd Client`
2. `npm install`
3. Configure `.env` with `VITE_API_URL`.
4. Start dev server: `npm run dev`

## Running the Project

Both servers run concurrently in development mode.
* **Backend API:** Available at `http://localhost:3000`
* **Frontend UI:** Available at `http://localhost:5173`
For production, the frontend can be built via `npm run build` and served statically.

## Testing Guide

To verify the core IAM engine, follow the exact sequence defined in the assessment:
1. Log in as **Root** and verify access to all 14 dashboard routes and IAM console.
2. Log in as **Alice**. Verify access to `reports:List`, `reports:Read`, `alerts:List`, `alerts:Read`, `audit:List`, `audit:Read`. Verify rejection (403) for `reports:Create`, `settings:Update`, and all `iam:*` routes.
3. Log in as **Root**. Create a policy granting `iam:ListPolicies`, `iam:ListGroups`, `iam:ListUsers`. Attach directly to **Bob**.
4. Log in as **Bob**. Verify ability to view policies, groups, users. Verify inability to create/delete them.
5. Log in as **Root**. Apply `ReadOnlyAccess` as a **Boundary** on Alice. Observe her effective permissions. Change boundary to a stricter policy and confirm Alice loses permissions.
6. Log in as **Root**. Give **Bob** `iam:CreatePolicy` and `iam:UpdatePolicy`.
7. Log in as **Bob**. Attempt to create a policy granting `reports:Delete`. Observe the **403 Delegation Bypass Prevention** block.
8. Log in as **Root**. Give Bob `ReportsFullAccess`. Log back in as **Bob** and successfully create the `reports:Delete` policy.
9. Log in as **Root**. Remove Alice's boundary and verify her permissions restore.

## Error Handling

* **400 Bad Request:** Missing fields, Zod validation errors, or invalid policy structures.
* **401 Unauthorized:** Missing, expired, or invalid JWT.
* **403 Forbidden:** User is authenticated but lacks required IAM action, blocked by boundary, or caught by delegation bypass.
* **404 Not Found:** Resource, user, group, or policy does not exist.
* **409 Conflict:** Attempting to create duplicate names (e.g., users, groups, policies).
* **500 Internal Server Error:** Unhandled server exceptions.

## Security Features

* **JWT Authentication:** Stateless, secure token-based access.
* **Password Hashing:** Passwords securely hashed with bcrypt.
* **IAM Middleware:** Centralized, deterministic evaluation logic.
* **Explicit Deny:** Deny rules unequivocally override allow rules.
* **Permission Boundaries:** Administrative safeguards to cap user privileges.
* **Delegation Bypass Prevention:** Prevents unauthorized privilege escalation.
* **Input Validation:** Zod schemas ensure exact, sanitized request bodies.

## Future Improvements

* **Resource-Level Permissions:** Evolving the `Resource: ["*"]` array to target specific database IDs (e.g., `reports:123`).
* **Wildcard Action Support:** Allowing actions like `reports:*` for dynamic evaluation.
* **Audit Logging:** Emitting events for every policy change to a separate immutable logging service.
* **Policy Versioning:** Ability to rollback managed policy updates.
* **Pagination:** Applying infinite scrolling/pagination on large user and group lists.

## Assessment Coverage

| Requirement | Implemented | Notes |
| --- | --- | --- |
| Node.js + Express Backend | Yes | Built with TypeScript |
| PostgreSQL + Prisma | Yes | Fully typed ORM schema |
| React + Vite Frontend | Yes | Tailwind CSS + shadcn/ui |
| Seed Script (Root + Alice/Bob) | Yes | Seeded securely via bcrypt |
| IAM Middleware | Yes | Protects both Resources and IAM itself |
| Explicit Deny precedence | Yes | Handled exactly as specified |
| Implicit Deny default | Yes | Handled exactly as specified |
| Permission Boundaries | Yes | Capped permissions, Root-only management |
| Delegation Bypass Prevention | Yes | Validated on create, update, and attach |
| Policy Statement Builder | Yes | Dropdown/toggle UI, no raw typing |
| Effective Permissions Summary | Yes | Real-time computed UI component |
| All Error Handling Codes | Yes | Detailed JSON responses |

## Repository Information

* **Backend Folder:** `/Backend`
* **Frontend Folder:** `/Client`
* **Development:** `npm run dev` inside both directories.
* **Linting:** `npm run lint` in Client.

## Acknowledgements
This project was implemented as a comprehensive self-administered IAM assessment, directly inspired by AWS IAM architecture concepts including identity policies, managed policies, strict explicit denial, and permission boundaries.

## Author
**Anuj Gupta**  
*Submitted in fulfillment of the Change Networks Assessment.*
