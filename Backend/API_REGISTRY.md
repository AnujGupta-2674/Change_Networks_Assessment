# API Registry

| Resource / Group | Method | Endpoint | Controller Method | Service Method | Repository Method | Zod Validation Schema | HTTP Status (Success) |
|---|---|---|---|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | `register` | `registerUser` | `findByEmail`, `create` | `registerSchema` | 201 |
| **Auth** | POST | `/api/auth/login` | `login` | `loginUser` | `findByEmail` | `loginSchema` | 200 |
| **Auth** | GET | `/api/auth/me` | `getCurrentUser` | N/A | `findById` | N/A | 200 |
| **Auth** | POST | `/api/auth/logout` | `logout` | N/A | N/A | N/A | 200 |
| **Policies** | POST | `/api/iam/policies` | `createPolicy` | `createPolicy` | `findByName`, `create` | `createPolicySchema` | 201 |
| **Policies** | GET | `/api/iam/policies` | `listPolicies` | `listPolicies` | `findAll` | N/A | 200 |
| **Policies** | GET | `/api/iam/policies/:id` | `getPolicy` | `getPolicy` | `findById` | N/A | 200 |
| **Policies** | PUT | `/api/iam/policies/:id` | `updatePolicy` | `updatePolicy` | `findById`, `findByName`, `update` | `updatePolicySchema` | 200 |
| **Policies** | DELETE | `/api/iam/policies/:id` | `deletePolicy` | `deletePolicy` | `findById`, `findGroupAttachments`, `findUserAttachments`, `delete` | N/A | 200 |
| **Groups** | POST | `/api/iam/groups` | `createGroup` | `createGroup` | `findByName`, `create` | `createGroupSchema` | 201 |
| **Groups** | GET | `/api/iam/groups` | `listGroups` | `listGroups` | `findAll` | N/A | 200 |
| **Groups** | GET | `/api/iam/groups/:id` | `getGroup` | `getGroup` | `findById` | N/A | 200 |
| **Groups** | PUT | `/api/iam/groups/:id` | `updateGroup` | `updateGroup` | `findById`, `findByName`, `update` | `updateGroupSchema` | 200 |
| **Groups** | DELETE | `/api/iam/groups/:id` | `deleteGroup` | `deleteGroup` | `findById`, `delete` (Policy repo: `delete`) | N/A | 200 |
| **Memberships** | POST | `/api/iam/groups/:id/members` | `addMember` | `addMember` | `findById`, `findMembership`, `addMember` | `addMemberSchema` | 200 |
| **Memberships** | DELETE | `/api/iam/groups/:id/members/:userId` | `removeMember` | `removeMember` | `findMembership`, `removeMember` | N/A | 200 |
| **Attachments** | POST | `/api/iam/groups/:id/policies` | `attachPolicy` | `attachPolicy` | `findById`, `findPolicyAttachment`, `attachPolicy` | `attachGroupPolicySchema` | 200 |
| **Attachments** | DELETE | `/api/iam/groups/:id/policies/:policyId` | `detachPolicy` | `detachPolicy` | `findPolicyAttachment`, `detachPolicy` | N/A | 200 |
| **Users** | GET | `/api/iam/users` | `listUsers` | `listUsers` | `findAll` | N/A | 200 |
| **Users** | GET | `/api/iam/users/:id` | `getUser` | `getUser` | `findByIdWithIAM` | N/A | 200 |
| **Attachments** | POST | `/api/iam/users/:id/policies` | `attachPolicy` | `attachPolicy` | `findById`, `findPolicyAttachment`, `attachPolicy` | `attachUserPolicySchema` | 200 |
| **Attachments** | DELETE | `/api/iam/users/:id/policies/:policyId` | `detachPolicy` | `detachPolicy` | `findPolicyAttachment`, `detachPolicy` | N/A | 200 |
| **Boundaries** | PUT | `/api/iam/users/:id/boundary` | `setBoundary` | `setBoundary` | `findById`, `setBoundary` | `putUserBoundarySchema` | 200 |
| **Boundaries** | DELETE | `/api/iam/users/:id/boundary` | `removeBoundary` | `removeBoundary` | `findById`, `removeBoundary` | N/A | 200 |
| **Reports** | GET/POST/PUT/DELETE | `/api/reports`, `/api/reports/:id` | `dummyAction` | N/A | N/A | N/A | 200 |
| **Alerts** | GET/POST/PATCH/DELETE | `/api/alerts`, `/api/alerts/:id` | `dummyAction` | N/A | N/A | N/A | 200 |
| **Settings** | GET/PUT | `/api/settings` | `dummyAction` | N/A | N/A | N/A | 200 |
| **Audit** | GET | `/api/audit`, `/api/audit/:id` | `dummyAction` | N/A | N/A | N/A | 200 |

## Expected Response Structure

**Success:**
```json
{
  "success": true,
  "data": { ... } // Or "message": "..."
}
```

**Failure:**
```json
{
  "success": false,
  "message": "Error details..."
}
```
