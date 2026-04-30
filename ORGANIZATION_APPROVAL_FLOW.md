# Organization Owner Account Creation with Super Admin Approval

## Overview

This document describes the implemented flow where organization owners create accounts for their organizations, and super admins approve/reject these requests.

## Flow Diagram

```
1. Organization Owner Registration
   ┌─────────────────┐
   │     Owner       │
   └────────┬────────┘
            │
            │ 2. Create Organization
            │    POST /api/organizations
            │    Body: { name, description }
            ▼
   ┌─────────────────┐
   │   Organization  │
   │   Status:       │
   │   "pending"     │
   └────────┬────────┘
            │
            │ 3. Auto-create membership
            │    (owner, status: pending)
            ▼
   ┌─────────────────┐
   │    Ownership    │
   │    Membership   │
   │    Created      │
   └─────────────────┘

2. Super Admin Approval
   ┌─────────────────┐
   │   Super Admin   │
   └────────┬────────┘
            │
            │ View pending orgs
            │ GET /api/organizations/pending
            ▼
   ┌─────────────────┐
   │  Review List    │
   └────────┬────────┘
            │
            │ Approve or Reject
            │ POST /api/organizations/:id/approve
            │ POST /api/organizations/:id/reject
            ▼
   ┌─────────────────┐
   │   Organization  │
   │   Status:       │
   │   "active" or   │
   │   "rejected"    │
   └────────┬────────┘
            │
            │ Auto-approve owner
            │ membership
            ▼
   ┌─────────────────┐
   │    Owner can    │
   │    now access   │
   │    org features │
   └─────────────────┘
```

## API Endpoints

### 1. Create Organization (Owner Registration)

**Endpoint:** `POST /api/organizations`

**Authentication:** Required (user must be authenticated via Supabase)

**Request Body:**
```json
{
  "name": "My Organization",
  "description": "Optional description"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Organization",
  "description": "Optional description",
  "owner_id": "user-uuid",
  "status": "pending",
  "invite_code": "ABCD1234",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Notes:**
- Organization is created with `status: "pending"`
- Owner's membership is automatically created with `status: "pending"`
- Organization cannot access protected features until approved

---

### 2. Get All Organizations (Admin Dashboard)

**Endpoint:** `GET /api/organizations`

**Query Parameters:**
- `status` (optional): Filter by status ("pending", "active", "rejected")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Organization",
      "status": "pending",
      "owner_id": "user-uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### 3. Get Pending Organizations

**Endpoint:** `GET /api/organizations/pending`

**Authentication:** Recommended (for admin only)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Pending Org 1",
    "status": "pending",
    "owner_id": "user-uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Pending Org 2",
    "status": "pending",
    "owner_id": "user-uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 4. Approve Organization

**Endpoint:** `POST /api/organizations/:id/approve`

**Authentication:** Required (super admin only)

**Path Parameters:**
- `id`: Organization UUID

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Organization",
  "status": "active",
  "approved_by": "admin-uuid",
  "approved_at": "2024-01-01T00:00:00Z",
  "rejection_reason": null,
  "owner_id": "user-uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Notes:**
- Organization status changes to `"active"`
- Owner's membership is automatically approved (`status: "active"`)
- Owner can now access all organization features

---

### 5. Reject Organization

**Endpoint:** `POST /api/organizations/:id/reject`

**Authentication:** Required (super admin only)

**Path Parameters:**
- `id`: Organization UUID

**Request Body:**
```json
{
  "reason": "Incomplete information"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Organization",
  "status": "rejected",
  "approved_by": "admin-uuid",
  "approved_at": "2024-01-01T00:00:00Z",
  "rejection_reason": "Incomplete information",
  "owner_id": "user-uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Notes:**
- Organization status changes to `"rejected"`
- Rejection reason is stored
- Owner's membership remains pending

---

## Database Schema Changes

### Organizations Model

Added fields:
```prisma
status           String    @default("pending")
approved_by      String?   @db.Uuid
approved_at      DateTime?
rejection_reason String?
```

**Status Values:**
- `"pending"`: Awaiting admin approval
- `"active"`: Approved and operational
- `"rejected"`: Rejected by admin

---

## Membership Auto-Creation

When an organization is created:
1. Organization is created with `status: "pending"`
2. A membership record is automatically created for the owner:
   - `user_id`: The authenticated user's ID
   - `org_id`: The newly created organization's ID
   - `status: "pending"`
   - `invite_method: "owner"`

When an organization is approved:
1. Organization status changes to `"active"`
2. Owner's membership is automatically updated:
   - `status: "active"`
   - `joined_at: current timestamp`

---

## Middleware Protection

### `requireApprovedOrg`

Protects routes that require an approved organization.

**Usage:**
```javascript
const { requireApprovedOrg } = require("./middleware/orgApproval");

router.get("/protected-route", requireAuth, requireApprovedOrg, (req, res) => {
  // Only accessible if user's org is approved
});
```

**Response if org is pending:**
```json
{
  "error": "Your organization is pending approval. Please wait for admin approval before accessing this feature.",
  "organizationStatus": "pending",
  "organizationName": "My Organization"
}
```

### `requireApprovedOrgById`

Protects routes operating on a specific organization.

**Usage:**
```javascript
router.get("/organizations/:id/data", requireApprovedOrgById, (req, res) => {
  // Only accessible if the specific org is approved
});
```

---

## Frontend Integration Example

### 1. Organization Registration

```javascript
async function createOrganization(name, description) {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ name, description })
  });
  
  const org = await response.json();
  
  if (org.status === 'pending') {
    // Show pending message
    alert('Organization created! Waiting for admin approval.');
  }
  
  return org;
}
```

### 2. Admin Dashboard - View Pending Organizations

```javascript
async function getPendingOrganizations() {
  const response = await fetch('/api/organizations/pending');
  const organizations = await response.json();
  return organizations;
}
```

### 3. Admin Approval

```javascript
async function approveOrganization(orgId) {
  const response = await fetch(`/api/organizations/${orgId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
}

async function rejectOrganization(orgId, reason) {
  const response = await fetch(`/api/organizations/${orgId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ reason })
  });
  return await response.json();
}
```

---

## Security Considerations

1. **Authentication Required**: All organization management endpoints require authentication
2. **Super Admin Only**: Approve/reject endpoints should be protected by admin role check (to be implemented based on your admin role system)
3. **Status Validation**: Organization status is checked before allowing operations
4. **Audit Trail**: `approved_by` and `approved_at` track who approved and when

---

## Testing the Flow

### Using cURL

1. **Create Organization:**
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Org","description":"Test"}'
```

2. **View Pending (Admin):**
```bash
curl http://localhost:3000/api/organizations/pending
```

3. **Approve (Admin):**
```bash
curl -X POST http://localhost:3000/api/organizations/ORG_UUID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

4. **Reject (Admin):**
```bash
curl -X POST http://localhost:3000/api/organizations/ORG_UUID/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Incomplete information"}'
```

---

## Next Steps / Recommendations

1. **Admin Role Check**: Implement proper super admin role verification in the approve/reject endpoints
2. **Email Notifications**: Send emails to owners when their org is approved/rejected
3. **Bulk Actions**: Add bulk approve/reject for multiple organizations
4. **Organization Edit**: Allow owners to edit pending organizations before approval
5. **Resubmission**: Allow rejected organizations to be resubmitted after fixing issues
