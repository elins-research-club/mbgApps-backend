# Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Auth](#admin-auth)
3. [User Management](#user-management)
4. [Organizations](#organizations)
5. [Menus & Nutrition](#menus--nutrition)
6. [Ingredients](#ingredients)
7. [Recipes](#recipes)
8. [Meal Plans](#meal-plans)

---

## Authentication

### POST /auth/sign-up
Create new user account with organization

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "userId": "83073deb-9b98-4718-b662-8222aa343d78",
  "email": "user@example.com",
  "organizationId": "uuid",
  "organizationStatus": "pending"
}
```

**What it creates:**
1. Supabase Auth user
2. Userext profile (role: "Org Owner", is_super_admin: false)
3. Organization (status: "pending")
4. Membership (status: "pending")

---

### POST /auth/sign-in
Sign in user

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "83073deb-9b98-4718-b662-8222aa343d78",
    "email": "user@example.com",
    "profile": {
      "full_name": "John Doe",
      "role": "Org Owner",
      "is_super_admin": false
    }
  },
  "organization": {
    "id": "uuid",
    "name": "John Doe's Organization",
    "status": "pending",
    "rejection_reason": null
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST /auth/sign-out
Sign out user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

---

## Admin Auth

### POST /auth/admin/sign-in
Admin login with super admin check

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "admin": {
    "id": "uuid",
    "fullName": "Super Admin",
    "role": "SuperAdmin",
    "is_super_admin": true
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "message": "Admin login successful"
}
```

**Validation:**
1. Authenticates with Supabase Auth
2. Checks `is_super_admin = true` in Userext
3. Returns 403 if not super admin

---

### GET /auth/admin/verify
Verify admin session

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "isAdmin": true,
  "admin": {
    "id": "uuid",
    "fullName": "Super Admin",
    "role": "SuperAdmin"
  }
}
```

---

## User Management

All user management endpoints require `requireSuperAdminMiddleware`.

### GET /admin/users
Get all users

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `status` (optional): "pending", "active", "rejected"

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "Org Owner",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
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

### POST /admin/users/:id/approve
Approve user registration

**Response (200):**
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "status": "active",
  "joined_at": "2024-01-01T00:00:00Z"
}
```

---

### POST /admin/users/:id/reject
Reject user registration

**Body:**
```json
{
  "reason": "Incomplete information"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "status": "rejected"
}
```

---

### PUT /admin/users/:id/role
Update user role

**Body:**
```json
{
  "roleId": "uuid"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "role_id": "uuid",
  "role": {
    "id": "uuid",
    "name": "Admin",
    "permissions": {}
  }
}
```

---

### DELETE /admin/users/:id
Delete user

**Response (200):**
```json
{
  "success": true,
  "message": "User membership deleted successfully"
}
```

---

## Organizations

### GET /organizations/pending
Get pending organizations (Super Admin only)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Test Organization",
    "description": "Description here",
    "owner_id": "uuid",
    "status": "pending",
    "invite_code": "ABCD1234",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### POST /organizations/:id/approve
Approve organization (Super Admin only)

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Test Organization",
  "status": "active",
  "approved_by": "admin-uuid",
  "approved_at": "2024-01-01T00:00:00Z",
  "rejection_reason": null
}
```

**What it does:**
1. Sets organization status to "active"
2. Sets approved_by and approved_at
3. Auto-approves owner's membership

---

### POST /organizations/:id/reject
Reject organization (Super Admin only)

**Body:**
```json
{
  "reason": "Invalid organization name"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Test Organization",
  "status": "rejected",
  "approved_by": "admin-uuid",
  "approved_at": "2024-01-01T00:00:00Z",
  "rejection_reason": "Invalid organization name"
}
```

---

### POST /organizations
Create organization (Requires auth)

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "My Organization",
  "description": "Organization description"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Organization",
  "description": "Organization description",
  "owner_id": "user-uuid",
  "status": "pending",
  "invite_code": "ABCD1234"
}
```

---

### GET /organizations/:id
Get organization by ID

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Organization",
  "description": "Description",
  "owner_id": "uuid",
  "status": "active",
  "invite_code": "ABCD1234"
}
```

---

### PUT /organizations/:id
Update organization

**Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description"
}
```

---

## Menus & Nutrition

### GET /menus
Get all menus

**Response (200):**
```json
[
  {
    "id": 1,
    "nama": "Nasi Putih",
    "kategori": "karbohidrat"
  }
]
```

---

### POST /generate
Calculate nutrition from ingredients

**Body:**
```json
{
  "ingredients": [
    {
      "nama": "Nasi",
      "gramasi": 100
    }
  ]
}
```

**Response (200):**
```json
{
  "energi": 130,
  "protein": 2.7,
  "lemak": 0.3,
  "karbohidrat": 28.2
}
```

---

### POST /suggest-menu
AI-powered menu suggestion

**Body:**
```json
{
  "targetClass": 10,
  "preferences": ["no seafood"],
  "budget": 50000
}
```

**Response (200):**
```json
{
  "menus": [...],
  "nutrition": {...}
}
```

---

## Ingredients

### GET /ingredients/search
Search ingredients

**Query:**
```
?query=nasi
```

**Response (200):**
```json
[
  {
    "id": 1,
    "nama": "Nasi Putih",
    "energi_kkal": 130,
    "protein_g": 2.7
  }
]
```

---

### POST /ingredients
Add new ingredient

**Body:**
```json
{
  "nama": "New Ingredient",
  "energi_kkal": 100,
  "protein_g": 5,
  "lemak_g": 2,
  "karbohidrat_g": 20
}
```

---

### PUT /ingredients/:id
Update ingredient nutrition

---

### DELETE /ingredients/:id
Delete ingredient

---

## Recipes

### GET /recipes
Get all recipes

### GET /recipes/:id
Get recipe by ID

### PUT /recipes/:id
Update recipe

### GET /recipes/:recipeId/nutrition
Get recipe nutrition

---

## Meal Plans

### POST /meal-plans
Save meal plan

### GET /meal-plans
Get all meal plans

### GET /meal-plans/:id
Get meal plan by ID

### DELETE /meal-plans/:id
Delete meal plan

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Super admin privileges required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

---

## Middleware

### requireAuth
Validates JWT token from Authorization header

**Usage:**
```javascript
router.get("/protected", requireAuth, (req, res) => {
  // req.userId and req.user available
});
```

### requireSuperAdminMiddleware
Validates JWT + checks is_super_admin flag

**Usage:**
```javascript
router.get("/admin", requireSuperAdminMiddleware, (req, res) => {
  // req.isSuperAdmin = true
});
```

---

## Rate Limiting

Not implemented yet. Consider adding:
- Express rate limit middleware
- Supabase Auth rate limiting
- Custom rate limiting per endpoint

---

## Testing

### Using cURL

```bash
# Sign up
curl -X POST http://localhost:3001/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Sign in
curl -X POST http://localhost:3001/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Admin sign in
curl -X POST http://localhost:3001/api/auth/admin/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Using Postman

1. Create collection: "MBG Apps API"
2. Set base URL: `http://localhost:3001/api`
3. Add auth token to Authorization tab
4. Test endpoints

---

## Support

For API issues:
1. Check backend logs
2. Verify database connection
3. Check Supabase Auth configuration
4. Ensure environment variables are set
