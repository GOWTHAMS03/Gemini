# App.tsx Integration - Copy-Paste Ready Code

## Complete Updated App.tsx with New Routes

Replace your current `admin-dashboard/src/App.tsx` with this version:

```typescript
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { RightPanel } from './components/layout/RightPanel';

// Import all pages
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { RecipePage } from './pages/RecipePage';
import { ProductionPage } from './pages/ProductionPage';
import { RawMaterialPage } from './pages/RawMaterialPage';
import { TripsPage } from './pages/TripsPage';
import { ShopsPage } from './pages/ShopsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { DriverSettlementPage } from './pages/DriverSettlementPage';
import { ReportsPage } from './pages/ReportsPage';
import { RoutesPage } from './pages/RoutesPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { FinanceDashboardPage } from './pages/FinanceDashboardPage';
import { PurchaseBillingPage } from './pages/PurchaseBillingPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CashBankPage } from './pages/CashBankPage';
import { SupplierLedgerPage } from './pages/SupplierLedgerPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { LoginPage } from './pages/LoginPage';

// Import new dispatch management pages
import DispatchGroupPage from './pages/DispatchGroupPage';
import RouteGroupPage from './pages/RouteGroupPage';

const routeTitleMap: Record<string, string> = {
  '/': 'Overview',
  '/employees': 'Employee Management',
  '/products': 'Products',
  '/categories': 'Categories',
  '/recipes': 'Recipes / BOM',
  '/production': 'Production',
  '/raw-materials': 'Raw Materials',
  '/dispatch-groups': 'Dispatch Groups',      // NEW
  '/route-groups': 'Route Groups',            // NEW
  '/trips': 'Trips & Dispatch',
  '/routes': 'Delivery Routes',
  '/shops': 'Shops & Customers',
  '/invoices': 'Sales & Invoices',
  '/returns': 'Returns & Replacement',
  '/finance': 'Finance Dashboard',
  '/purchases': 'Purchase Billing',
  '/expenses': 'Expenses',
  '/cash-bank': 'Cash & Bank Treasury',
  '/supplier-ledgers': 'Supplier Ledgers',
  '/financial-reports': 'Financial Reports',
  '/collections': 'Driver Collections',
  '/reports': 'Reports & Analytics',
};

export default function App() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);

  const pageTitle = routeTitleMap[location.pathname] || 'Page';

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setShowSidebar(!showSidebar)} pageTitle={pageTitle} />
        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/recipes" element={<RecipePage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/raw-materials" element={<RawMaterialPage />} />
              
              {/* NEW DISPATCH MANAGEMENT ROUTES */}
              <Route path="/dispatch-groups" element={<DispatchGroupPage />} />
              <Route path="/route-groups" element={<RouteGroupPage />} />
              
              {/* EXISTING ROUTES */}
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/finance" element={<FinanceDashboardPage />} />
              <Route path="/purchases" element={<PurchaseBillingPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/cash-bank" element={<CashBankPage />} />
              <Route path="/supplier-ledgers" element={<SupplierLedgerPage />} />
              <Route path="/financial-reports" element={<FinancialReportsPage />} />
              <Route path="/collections" element={<DriverSettlementPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
          {location.pathname !== '/login' && <RightPanel />}
        </div>
      </div>
    </div>
  );
}
```

---

## Sidebar Navigation Update

Update your Sidebar component to include the new menu items.

Add this to your navigation menu (usually in `components/layout/Sidebar.tsx`):

```tsx
// Add these imports
import { Users, MapPin, Truck } from 'lucide-react';

// In your navigation items array, add:
{
  label: 'Dispatch Management',
  icon: Truck,
  submenu: [
    {
      label: 'Dispatch Groups',
      href: '/dispatch-groups',
      icon: Users,
      description: 'Manage dispatch teams (Driver + Vehicle + Sales Person)'
    },
    {
      label: 'Route Groups',
      href: '/route-groups',
      icon: MapPin,
      description: 'Create and manage delivery routes'
    },
    {
      label: 'Trip Dispatch',
      href: '/trips',
      icon: Truck,
      description: 'Create and dispatch trips'
    }
  ]
},
```

---

## Navigation Component Example

If you have a simple NavLink component:

```tsx
// In your Sidebar or Navigation component
<nav className="space-y-2">
  {/* Existing navigation items... */}
  
  {/* NEW DISPATCH SECTION */}
  <div className="mt-8 pt-4 border-t border-gray-300">
    <p className="px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
      Dispatch Management
    </p>
    
    <a
      href="/dispatch-groups"
      className="mt-4 flex items-center px-4 py-2 rounded-lg hover:bg-blue-100 transition"
    >
      <Users className="w-5 h-5" />
      <span className="ml-3">Dispatch Groups</span>
    </a>
    
    <a
      href="/route-groups"
      className="flex items-center px-4 py-2 rounded-lg hover:bg-blue-100 transition"
    >
      <MapPin className="w-5 h-5" />
      <span className="ml-3">Route Groups</span>
    </a>
    
    <a
      href="/trips"
      className="flex items-center px-4 py-2 rounded-lg hover:bg-blue-100 transition"
    >
      <Truck className="w-5 h-5" />
      <span className="ml-3">Trip Dispatch</span>
    </a>
  </div>
</nav>
```

---

## Dark Mode Support

The new components fully support dark mode. Ensure your Tailwind config includes:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      // your extensions
    },
  },
  plugins: [],
}
```

And in your main component wrapper:
```tsx
<div className="dark">
  {/* Your app components */}
</div>
```

---

## API Service Configuration

Ensure your axios/API service is configured correctly. Add to `services/apiService.ts`:

```typescript
import axios from 'axios';

// Set base URL for all API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9023/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

Then use it in components:
```typescript
import axios from './services/apiService';

// Components automatically use configured API
const response = await axios.get('/dispatch-groups');
```

---

## Environment Variables

Create `.env` file in `admin-dashboard` root:

```env
REACT_APP_API_URL=http://localhost:9023/api/v1
REACT_APP_APP_NAME=Bread Factory ERP
REACT_APP_VERSION=1.0.0
```

---

## Testing the Integration

After updating App.tsx:

1. **Clear browser cache:**
   ```bash
   # Or manually in browser DevTools
   Ctrl+Shift+Del
   ```

2. **Restart dev server:**
   ```bash
   cd admin-dashboard
   npm run dev
   ```

3. **Test navigation:**
   - Check sidebar shows new menu items
   - Click each new menu item
   - Verify pages load without errors
   - Check browser console for TypeScript/JS errors

4. **Test API connections:**
   ```bash
   # Open browser console and run:
   fetch('http://localhost:9023/api/v1/dispatch-groups')
     .then(r => r.json())
     .then(data => console.log(data))
   ```

---

## Common Issues & Fixes

### Issue: Import errors for new components
**Solution:** Ensure files exist at:
- `admin-dashboard/src/pages/DispatchGroupPage.tsx`
- `admin-dashboard/src/pages/RouteGroupPage.tsx`

### Issue: Blank pages after navigation
**Solution:**
1. Clear cache: Ctrl+Shift+Del
2. Restart dev server: Ctrl+C then `npm run dev`
3. Hard refresh page: Ctrl+F5

### Issue: API 401/403 errors
**Solution:**
1. Login first to get auth token
2. Verify token is stored in localStorage
3. Check Authorization header in network tab
4. Refresh token if expired

### Issue: Styles not applied
**Solution:**
1. Run: `npm install tailwindcss` (if missing)
2. Check `tailwind.config.js` exists
3. Rebuild: `npm run build`
4. Restart: `npm run dev`

---

## Next Steps

1. ✅ Update App.tsx with imports and routes
2. ✅ Update Sidebar navigation
3. ✅ Restart frontend dev server
4. ✅ Test navigation to new pages
5. ✅ Verify backend API connectivity
6. ✅ Create test data (dispatch group → route → trip)

**Your frontend is now ready to use!**
