# 🔐 Fix 403 Forbidden API Error - Complete Guide

## Problem
When calling API endpoints like `GET /api/v1/trips`, you get:
```
Status Code: 403 Forbidden
Response: Unauthorized
```

## Root Cause
The 403 error occurs because:
1. **Missing or Invalid JWT Token** - The API request doesn't include the Authorization header with a valid JWT token
2. **User lacks permissions** - The logged-in user doesn't have required role/permissions for that endpoint
3. **Token expired** - The JWT token in localStorage has expired

---

## Solution

### Step 1: Ensure User is Logged In

1. Navigate to login page: `http://localhost:3001/login`
2. Enter credentials:
   - **Username:** `admin` or `sales_manager` (or your user account)
   - **Password:** Your password
3. Click Login - this stores JWT token in localStorage

### Step 2: Verify Token is Saved

Open browser DevTools (F12) → Application → LocalStorage → Look for `auth_token`:
```
Key: auth_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (long string)
```

If not present, login again or create test user in database.

### Step 3: Verify Backend is Running

Test backend connectivity with curl:

```bash
# Without token (will get 403)
curl http://localhost:9023/api/v1/trips

# With token (replace YOUR_TOKEN with actual token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9023/api/v1/trips
```

Expected response: 200 OK with trip data

### Step 4: Check Role-Based Permissions

Different endpoints require different roles:

| Endpoint | Required Role | Description |
|----------|---------------|-------------|
| GET /trips | DRIVER, SALES_MANAGER, SUPER_ADMIN | View trips |
| POST /trips | SALES_MANAGER, SUPER_ADMIN | Create trip |
| POST /trips/{id}/dispatch | SALES_MANAGER, SUPER_ADMIN | Dispatch trip |
| GET /dispatch-groups | SALES_MANAGER, SUPER_ADMIN | View dispatch groups |
| POST /dispatch-groups | SUPER_ADMIN | Create dispatch group |

**Login with appropriate user role** if getting 403 on specific endpoints.

---

## Why TripsPage Now Works

The updated `TripsPage.tsx` now:

✅ **Imports authenticated API service:**
```typescript
import api from '../services/apiService';
```

✅ **Automatically adds JWT token to all requests:**
```typescript
// apiService.ts - automatically adds header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

✅ **Handles 403 errors with user-friendly messages:**
```typescript
if (err.response?.status === 403) {
  alert('Access Denied: Please ensure you are logged in with proper permissions.');
}
```

✅ **Handles 401 (expired token) and redirects to login:**
```typescript
if (err.response?.status === 401) {
  alert('Session expired. Please login again.');
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
```

---

## API Endpoints Now Used in TripsPage

All calls use authenticated `api` instance:

```typescript
// Fetch trips (authenticated)
api.get('/trips')

// Fetch dispatch groups (authenticated)
api.get('/dispatch-groups')

// Fetch routes (authenticated)
api.get('/route-groups')

// Fetch products (authenticated)
api.get('/products')

// Create trip (authenticated)
api.post('/trips', { ...tripData })

// Dispatch trip (authenticated)
api.post(`/trips/${tripId}/dispatch`)

// Delete trip (authenticated)
api.delete(`/trips/${id}`)

// Onboard driver (authenticated)
api.post('/employees', { ...driverData })

// Onboard vehicle (authenticated)
api.post('/vehicles', { ...vehicleData })
```

---

## Database Prerequisites

Before testing, ensure database has:

1. **A User with SALES_MANAGER role:**
```sql
INSERT INTO users (username, password, full_name, email, role, active)
VALUES ('sales_manager', 'password_hash', 'Sales Manager', 'sm@example.com', 'SALES_MANAGER', true);
```

2. **Dispatch Groups (for dropdown):**
```sql
INSERT INTO dispatch_groups (group_name, sales_person_id, driver_id, vehicle_id, status)
VALUES ('Team A', 1, 1, 1, 'ACTIVE');
```

3. **Routes (for dropdown):**
```sql
INSERT INTO route_groups (route_name, description, area_region, is_active)
VALUES ('Salem Route', 'Salem district route', 'Salem', true);
```

4. **Products (for loading):**
```sql
INSERT INTO products (product_name, sku, category, active)
VALUES ('Bread 400g', 'SKU-001', 'Bakery', true);
```

---

## Testing the Fixed API

### Test 1: List Trips
```bash
# 1. Open browser DevTools (F12)
# 2. Go to Console tab
# 3. Run:

fetch('http://localhost:9023/api/v1/trips', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err.status, err))
```

Expected: Array of trip objects or empty array

### Test 2: Create Trip (After Login)
1. In TripsPage, click "Dispatch New Trip"
2. Form should populate with dispatch groups and routes from API
3. Fill form and click "Dispatch Vehicle Trip"
4. New trip should be created and appear in table

### Test 3: Verify Error Handling
1. Logout (clear localStorage)
2. Try to access Trips page
3. Should show: "Session expired. Please login again."
4. Should redirect to login page

---

## Common Issues & Fixes

### Issue 1: Still getting 403 after login

**Cause:** User doesn't have required role

**Fix:**
1. Update user's role in database to SUPER_ADMIN
2. Clear localStorage and login again
3. Or create new user with SUPER_ADMIN role

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'your_username';
```

### Issue 2: Token not saved in localStorage

**Cause:** Login failed or CORS issue

**Fix:**
1. Check browser Console for errors
2. Verify backend login endpoint returns token
3. Check CORS configuration in backend
4. Try login with curl:
```bash
curl -X POST http://localhost:9023/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Issue 3: "Cannot read property auth_token of null"

**Cause:** localStorage.getItem('auth_token') returns null

**Fix:**
1. Login successfully to populate token
2. Or manually set token in localStorage:
```javascript
// In browser console
localStorage.setItem('auth_token', 'YOUR_TOKEN_HERE');
```

### Issue 4: 401 Unauthorized (Token Expired)

**Cause:** JWT token has expired

**Fix:**
1. Login again to get fresh token
2. Or implement token refresh logic

---

## Environment Setup

### .env file (admin-dashboard/)
```env
VITE_API_URL=http://localhost:9023/api/v1
```

### Backend Configuration
Ensure Spring Security is configured to issue JWTs:
```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: update
  datasource:
    url: jdbc:postgresql://localhost:5432/bread_erp
    username: postgres
    password: password

jwt:
  secret: your-secret-key-here
  expiration: 86400000  # 24 hours in ms
```

---

## Summary

✅ **Updated Code:**
- TripsPage.tsx now uses authenticated `api` instance
- All forms fetch data from backend API
- Proper JWT token handling and error messages
- 403/401 errors handled gracefully

✅ **User Must:**
1. Login with valid credentials
2. User must have appropriate role (SALES_MANAGER or SUPER_ADMIN)
3. JWT token must be stored in localStorage
4. Backend must be running with database configured

✅ **Test Workflow:**
1. Login → Backend issues JWT token, stores in localStorage
2. TripsPage loads → API calls include Authorization header
3. Backend validates JWT → Returns 200 with data
4. Forms display API data in dropdowns
5. Submit form → Creates new records in database

---

**All 403 errors should now be resolved!** 🎉

If issues persist:
1. Check browser DevTools Console for errors
2. Check backend logs for authentication issues
3. Verify JWT token format and expiration
4. Confirm user role in database
