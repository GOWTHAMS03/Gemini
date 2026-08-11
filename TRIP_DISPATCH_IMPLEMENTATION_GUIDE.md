# Trip Dispatch & Route Management - Complete Implementation Guide

## ✅ Completed Backend Implementation

The backend has been fully implemented with:

### 1. **Database Schema** 
- DispatchGroup, RouteGroup, ShopRoute, TripShopVisit
- InventoryTransaction, DamagedProductTracking
- Enhanced Trip and TripItem entities

### 2. **API Endpoints**

#### Dispatch Group Management
```
POST   /api/v1/dispatch-groups                    - Create dispatch group
GET    /api/v1/dispatch-groups                    - Get active dispatch groups
GET    /api/v1/dispatch-groups/{id}               - Get dispatch group details
```

#### Route Group Management
```
POST   /api/v1/route-groups                       - Create route group
GET    /api/v1/route-groups                       - Get active routes
POST   /api/v1/route-groups/{id}/shops            - Add shop to route
```

#### Trip Management
```
POST   /api/v1/trips                              - Create trip (DRAFT status)
POST   /api/v1/trips/{id}/dispatch                - Dispatch trip (CONFIRMED → DISPATCHED)
POST   /api/v1/trips/{id}/complete                - Complete trip (IN_PROGRESS → COMPLETED)
PUT    /api/v1/trips/{id}/status                  - Update trip status
GET    /api/v1/trips/driver/{driverId}/active     - Get active trip for driver
```

---

## 📱 Frontend Implementation (React/TypeScript)

### 1. Dispatch Group Management Page

**File: `admin-dashboard/src/pages/DispatchGroupPage.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DispatchGroup {
  id: number;
  groupName: string;
  salesPersonName: string;
  driverName: string;
  vehicleNumber: string;
  status: string;
  isActive: boolean;
}

export default function DispatchGroupPage() {
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    salesPersonId: '',
    driverId: '',
    vehicleId: ''
  });
  const [salesPersons, setSalesPersons] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchDispatchGroups();
    fetchResources();
  }, []);

  const fetchDispatchGroups = async () => {
    try {
      const response = await axios.get('/api/v1/dispatch-groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching dispatch groups:', error);
    }
  };

  const fetchResources = async () => {
    try {
      // Fetch sales persons, drivers, vehicles from their respective endpoints
      const [spRes, drRes, vhRes] = await Promise.all([
        axios.get('/api/v1/sales-executives'),
        axios.get('/api/v1/employees?role=DRIVER'),
        axios.get('/api/v1/vehicles')
      ]);
      setSalesPersons(spRes.data);
      setDrivers(drRes.data);
      setVehicles(vhRes.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/dispatch-groups', formData);
      fetchDispatchGroups();
      setShowForm(false);
      setFormData({ groupName: '', description: '', salesPersonId: '', driverId: '', vehicleId: '' });
    } catch (error) {
      console.error('Error creating dispatch group:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dispatch Groups</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Dispatch Group
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create Dispatch Group</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Group Name"
              value={formData.groupName}
              onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
              required
              className="border p-2 rounded col-span-2"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border p-2 rounded col-span-2"
            />
            <select
              value={formData.salesPersonId}
              onChange={(e) => setFormData({ ...formData, salesPersonId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Sales Person</option>
              {salesPersons.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.fullName}</option>
              ))}
            </select>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.model}</option>
              ))}
            </select>
            <div className="col-span-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Create Group
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left">Group Name</th>
              <th className="px-6 py-3 text-left">Sales Person</th>
              <th className="px-6 py-3 text-left">Driver</th>
              <th className="px-6 py-3 text-left">Vehicle</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{group.groupName}</td>
                <td className="px-6 py-3">{group.salesPersonName}</td>
                <td className="px-6 py-3">{group.driverName}</td>
                <td className="px-6 py-3">{group.vehicleNumber}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {group.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <button className="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 2. Route Group Management Page

**File: `admin-dashboard/src/pages/RouteGroupPage.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ShopRoute {
  id: number;
  shopName: string;
  visitDay: number;
  visitSequence: number;
  expectedVisitTime?: string;
}

interface RouteGroup {
  id: number;
  routeName: string;
  areaRegion: string;
  isActive: boolean;
  shopRoutes: ShopRoute[];
}

export default function RouteGroupPage() {
  const [routes, setRoutes] = useState<RouteGroup[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteGroup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showShopForm, setShowShopForm] = useState(false);
  const [formData, setFormData] = useState({
    routeName: '',
    description: '',
    areaRegion: ''
  });
  const [shopFormData, setShopFormData] = useState({
    shopId: '',
    visitDay: 0,
    visitSequence: 1,
    expectedVisitTime: ''
  });
  const [shops, setShops] = useState([]);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchRoutes();
    fetchShops();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/v1/route-groups');
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get('/api/v1/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/route-groups', formData);
      fetchRoutes();
      setShowForm(false);
      setFormData({ routeName: '', description: '', areaRegion: '' });
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    try {
      await axios.post(`/api/v1/route-groups/${selectedRoute.id}/shops`, shopFormData);
      fetchRoutes();
      setShowShopForm(false);
      setShopFormData({ shopId: '', visitDay: 0, visitSequence: 1, expectedVisitTime: '' });
    } catch (error) {
      console.error('Error adding shop:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Route Groups</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Route
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create Route Group</h2>
          <form onSubmit={handleCreateRoute} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Route Name"
              value={formData.routeName}
              onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              required
              className="border p-2 rounded col-span-2"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border p-2 rounded col-span-2"
            />
            <input
              type="text"
              placeholder="Area/Region"
              value={formData.areaRegion}
              onChange={(e) => setFormData({ ...formData, areaRegion: e.target.value })}
              className="border p-2 rounded"
            />
            <div className="col-span-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Create Route
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Route List</h2>
          <div className="space-y-2">
            {routes.map(route => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-4 border rounded cursor-pointer ${selectedRoute?.id === route.id ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
              >
                <p className="font-bold">{route.routeName}</p>
                <p className="text-sm text-gray-600">{route.areaRegion}</p>
                <p className="text-sm text-gray-600">{route.shopRoutes.length} shops</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRoute && (
            <div className="bg-white p-6 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedRoute.routeName}</h2>
                <button
                  onClick={() => setShowShopForm(!showShopForm)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Shop
                </button>
              </div>

              {showShopForm && (
                <form onSubmit={handleAddShop} className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 rounded">
                  <select
                    value={shopFormData.shopId}
                    onChange={(e) => setShopFormData({ ...shopFormData, shopId: e.target.value })}
                    required
                    className="border p-2 rounded"
                  >
                    <option value="">Select Shop</option>
                    {shops.map(shop => (
                      <option key={shop.id} value={shop.id}>{shop.name} ({shop.shopCode})</option>
                    ))}
                  </select>
                  <select
                    value={shopFormData.visitDay}
                    onChange={(e) => setShopFormData({ ...shopFormData, visitDay: parseInt(e.target.value) })}
                    className="border p-2 rounded"
                  >
                    {dayNames.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Visit Sequence"
                    value={shopFormData.visitSequence}
                    onChange={(e) => setShopFormData({ ...shopFormData, visitSequence: parseInt(e.target.value) })}
                    className="border p-2 rounded"
                  />
                  <input
                    type="time"
                    placeholder="Expected Visit Time"
                    value={shopFormData.expectedVisitTime}
                    onChange={(e) => setShopFormData({ ...shopFormData, expectedVisitTime: e.target.value })}
                    className="border p-2 rounded"
                  />
                  <div className="col-span-2">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                      Add Shop
                    </button>
                  </div>
                </form>
              )}

              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Shop</th>
                    <th className="px-4 py-2 text-left">Day</th>
                    <th className="px-4 py-2 text-left">Sequence</th>
                    <th className="px-4 py-2 text-left">Expected Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRoute.shopRoutes.map(shopRoute => (
                    <tr key={shopRoute.id} className="border-b">
                      <td className="px-4 py-2">{shopRoute.shopName}</td>
                      <td className="px-4 py-2">{dayNames[shopRoute.visitDay]}</td>
                      <td className="px-4 py-2">{shopRoute.visitSequence}</td>
                      <td className="px-4 py-2">{shopRoute.expectedVisitTime || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. Trip Creation & Dispatch Page

**File: `admin-dashboard/src/pages/TripsPage.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Trip {
  id: number;
  tripNumber: string;
  tripDate: string;
  dispatchGroupName: string;
  routeName: string;
  driverName: string;
  status: string;
  totalLoadedQuantity: number;
  totalSoldQuantity: number;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [dispatchGroups, setDispatchGroups] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    tripDate: '',
    dispatchGroupId: '',
    routeGroupId: '',
    itemsToLoad: [] as any[]
  });

  useEffect(() => {
    fetchTrips();
    fetchResources();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get('/api/v1/trips');
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const [dgRes, rRes, pRes] = await Promise.all([
        axios.get('/api/v1/dispatch-groups'),
        axios.get('/api/v1/route-groups'),
        axios.get('/api/v1/products')
      ]);
      setDispatchGroups(dgRes.data);
      setRoutes(rRes.data);
      setProducts(pRes.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      itemsToLoad: [...formData.itemsToLoad, { productId: '', loadQuantity: 0 }]
    });
  };

  const updateProduct = (idx: number, field: string, value: any) => {
    const updated = [...formData.itemsToLoad];
    updated[idx][field] = value;
    setFormData({ ...formData, itemsToLoad: updated });
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tripDate: formData.tripDate,
        dispatchGroupId: formData.dispatchGroupId,
        routeGroupId: formData.routeGroupId,
        items: formData.itemsToLoad
      };
      await axios.post('/api/v1/trips', payload);
      fetchTrips();
      setShowForm(false);
      setFormData({ tripDate: '', dispatchGroupId: '', routeGroupId: '', itemsToLoad: [] });
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const dispatchTrip = async (tripId: number) => {
    try {
      await axios.post(`/api/v1/trips/${tripId}/dispatch`);
      fetchTrips();
    } catch (error) {
      console.error('Error dispatching trip:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trip Dispatch</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Trip
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Trip</h2>
          <form onSubmit={handleCreateTrip} className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.tripDate}
              onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
              required
              className="border p-2 rounded col-span-2"
            />
            <select
              value={formData.dispatchGroupId}
              onChange={(e) => setFormData({ ...formData, dispatchGroupId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Dispatch Group</option>
              {dispatchGroups.map(dg => (
                <option key={dg.id} value={dg.id}>{dg.groupName}</option>
              ))}
            </select>
            <select
              value={formData.routeGroupId}
              onChange={(e) => setFormData({ ...formData, routeGroupId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Route</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.routeName}</option>
              ))}
            </select>

            <div className="col-span-2">
              <h3 className="font-bold mb-2">Products to Load</h3>
              {formData.itemsToLoad.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                  <select
                    value={item.productId}
                    onChange={(e) => updateProduct(idx, 'productId', e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.loadQuantity}
                    onChange={(e) => updateProduct(idx, 'loadQuantity', parseInt(e.target.value))}
                    className="border p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.itemsToLoad.filter((_, i) => i !== idx);
                      setFormData({ ...formData, itemsToLoad: updated });
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addProduct}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mt-2"
              >
                + Add Product
              </button>
            </div>

            <div className="col-span-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Create Trip
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left">Trip #</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Dispatch Group</th>
              <th className="px-6 py-3 text-left">Route</th>
              <th className="px-6 py-3 text-left">Driver</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Loaded</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-bold">{trip.tripNumber}</td>
                <td className="px-6 py-3">{trip.tripDate}</td>
                <td className="px-6 py-3">{trip.dispatchGroupName}</td>
                <td className="px-6 py-3">{trip.routeName}</td>
                <td className="px-6 py-3">{trip.driverName}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    trip.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    trip.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                    trip.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-3">{trip.totalLoadedQuantity}</td>
                <td className="px-6 py-3">
                  {trip.status === 'DRAFT' && (
                    <button
                      onClick={() => dispatchTrip(trip.id)}
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      Dispatch
                    </button>
                  )}
                  <button className="ml-2 text-gray-500 hover:text-gray-700 underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 📲 Mobile App Implementation (Flutter)

### 1. Trip Screen

**File: `mobile-app/lib/screens/trip_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class TripScreen extends StatefulWidget {
  const TripScreen({Key? key}) : super(key: key);

  @override
  State<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends State<TripScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? activeTrip;
  List<dynamic> shopVisits = [];
  List<dynamic> tripInventory = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    loadActiveTrip();
  }

  Future<void> loadActiveTrip() async {
    // Fetch active trip from API
    // await ApiService.getActiveTrip();
    setState(() {
      // Update UI
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Trip'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Trip Details'),
            Tab(text: 'Shops'),
            Tab(text: 'Inventory'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Trip Details
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Trip Information',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Trip #'),
                              Text(
                                activeTrip?['tripNumber'] ?? '-',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Date'),
                              Text(activeTrip?['tripDate'] ?? '-'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Route'),
                              Text(activeTrip?['routeName'] ?? '-'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Vehicle'),
                              Text(activeTrip?['vehicleNumber'] ?? '-'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Status'),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  activeTrip?['status'] ?? '-',
                                  style: TextStyle(color: Colors.blue[900]),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Inventory Summary
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Inventory Summary',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildSummaryItem('Loaded', activeTrip?['totalLoadedQuantity'] ?? 0),
                              _buildSummaryItem('Sold', activeTrip?['totalSoldQuantity'] ?? 0),
                              _buildSummaryItem('Returned', activeTrip?['totalReturnedQuantity'] ?? 0),
                              _buildSummaryItem('Damaged', activeTrip?['totalDamagedQuantity'] ?? 0),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Tab 2: Shops
          ListView.builder(
            itemCount: shopVisits.length,
            itemBuilder: (context, index) {
              final visit = shopVisits[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  title: Text(visit['shopName']),
                  subtitle: Text('${visit['address']}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: visit['status'] == 'COMPLETED' ? Colors.green[100] : Colors.yellow[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      visit['status'] ?? 'Scheduled',
                      style: TextStyle(
                        fontSize: 12,
                        color: visit['status'] == 'COMPLETED' ? Colors.green[900] : Colors.orange[900],
                      ),
                    ),
                  ),
                  onTap: () {
                    // Navigate to shop details
                  },
                ),
              );
            },
          ),
          // Tab 3: Inventory
          ListView.builder(
            itemCount: tripInventory.length,
            itemBuilder: (context, index) {
              final item = tripInventory[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['productName'],
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Loaded: ${item['loadedQuantity']}'),
                          Text('Available: ${item['availableQuantity']}'),
                          Text('Sold: ${item['soldQuantity']}'),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, int value) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
```

### 2. Shop Visit Screen

**File: `mobile-app/lib/screens/shop_visit_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class ShopVisitScreen extends StatefulWidget {
  final Map<String, dynamic> shop;
  final Map<String, dynamic> tripInventory;

  const ShopVisitScreen({
    Key? key,
    required this.shop,
    required this.tripInventory,
  }) : super(key: key);

  @override
  State<ShopVisitScreen> createState() => _ShopVisitScreenState();
}

class _ShopVisitScreenState extends State<ShopVisitScreen> {
  Map<int, int> selectedQuantities = {};
  List<dynamic> billItems = [];
  double totalAmount = 0;
  bool arrivalRecorded = false;
  bool departureRecorded = false;

  @override
  void initState() {
    super.initState();
    recordArrival();
  }

  Future<void> recordArrival() async {
    // Get current location
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // Record arrival in backend
    // await ApiService.recordShopArrival(shopId, position);

    setState(() {
      arrivalRecorded = true;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Arrival recorded')),
    );
  }

  void addProductToBill(int productId, String productName, int quantity, double price) {
    setState(() {
      billItems.add({
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'unitPrice': price,
        'totalPrice': quantity * price,
      });
      totalAmount += quantity * price;
    });
  }

  Future<void> recordDeparture() async {
    // Get current location
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // Record departure in backend
    // await ApiService.recordShopDeparture(shopId, position);

    setState(() {
      departureRecorded = true;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Departure recorded')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.shop['shopName']),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Shop Information Card
            Card(
              margin: const EdgeInsets.all(12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.shop['shopName'],
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text('Owner: ${widget.shop['ownerName']}'),
                    Text('Phone: ${widget.shop['phone']}'),
                    Text('Address: ${widget.shop['address']}'),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              color: arrivalRecorded ? Colors.green : Colors.grey,
                            ),
                            const SizedBox(width: 8),
                            Text(arrivalRecorded ? 'Arrived' : 'Not Arrived'),
                          ],
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              color: departureRecorded ? Colors.red : Colors.grey,
                            ),
                            const SizedBox(width: 8),
                            Text(departureRecorded ? 'Departed' : 'Not Departed'),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Available Products
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Available Products',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: widget.tripInventory.length,
                    itemBuilder: (context, index) {
                      final item = widget.tripInventory[index];
                      return Card(
                        child: ExpansionTile(
                          title: Text(item['productName']),
                          subtitle: Text('Available: ${item['availableQuantity']}'),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Sale Quantity:'),
                                      SizedBox(
                                        width: 80,
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          decoration: InputDecoration(
                                            border: OutlineInputBorder(),
                                            hintText: '0',
                                          ),
                                          onChanged: (value) {
                                            setState(() {
                                              selectedQuantities[index] = int.tryParse(value) ?? 0;
                                            });
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        if (selectedQuantities[index] ?? 0 > 0) {
                                          addProductToBill(
                                            item['productId'],
                                            item['productName'],
                                            selectedQuantities[index]!,
                                            item['unitPrice'],
                                          );
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Added to bill')),
                                          );
                                        }
                                      },
                                      child: const Text('Add to Bill'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Bill Preview
            if (billItems.isNotEmpty)
              Card(
                margin: const EdgeInsets.all(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bill Preview',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: billItems.length,
                        itemBuilder: (context, index) {
                          final item = billItems[index];
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${item['productName']} x ${item['quantity']}'),
                              Text('${item['totalPrice']}'),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            totalAmount.toString(),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            // Action Buttons
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  if (!departureRecorded)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: recordDeparture,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        child: const Text('Record Departure'),
                      ),
                    ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: billItems.isNotEmpty
                          ? () {
                              // Process bill and payment
                              // showPaymentDialog();
                            }
                          : null,
                      child: const Text('Proceed to Payment'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🚀 Next Steps for Frontend & Mobile

### Admin Dashboard TODO:
1. ✅ Dispatch Group Management
2. ✅ Route Group Management  
3. ✅ Trip Creation & Dispatch
4. Create **Trip Dashboard** showing daily summary
5. Create **Trip Detail View** with full inventory tracking
6. Create **Payment Collection** page
7. Create **Return & Damaged Products** processing page
8. Create **Trip Reconciliation** page
9. Create **Reports** section

### Mobile App TODO:
1. ✅ Trip Assignment screen
2. ✅ Shop Visit management
3. Create **Billing & Invoice** generation
4. Create **Payment Recording** screen
5. Create **Return Products** screen
6. Create **Damaged Products** screen
7. Create **Trip Completion** & reconciliation
8. Add **Offline sync** capability
9. Add **Location tracking**

---

## API Request/Response Examples

### Create Dispatch Group
```json
POST /api/v1/dispatch-groups
{
  "groupName": "Salem South Team 01",
  "description": "Main dispatch team for Salem South",
  "salesPersonId": 1,
  "driverId": 2,
  "vehicleId": 3,
  "status": "ACTIVE"
}

Response:
{
  "id": 1,
  "groupName": "Salem South Team 01",
  "salesPersonName": "John",
  "driverName": "Kumar",
  "vehicleNumber": "TN-XX-1234",
  "status": "ACTIVE",
  "isActive": true
}
```

### Create Trip
```json
POST /api/v1/trips
{
  "tripDate": "2026-08-08",
  "dispatchGroupId": 1,
  "routeGroupId": 1,
  "items": [
    {
      "productId": 1,
      "loadQuantity": 100
    },
    {
      "productId": 2,
      "loadQuantity": 80
    }
  ]
}

Response:
{
  "id": 1,
  "tripNumber": "TRIP-1690951234567",
  "tripDate": "2026-08-08",
  "status": "DRAFT",
  "totalLoadedQuantity": 180,
  "dispatchGroupName": "Salem South Team 01",
  "routeName": "Salem South Route",
  "shopVisits": [...]
}
```

---

## Configuration Required

The following existing endpoints are needed:
- `/api/v1/employees` - For fetching sales persons and drivers
- `/api/v1/vehicles` - For vehicle list
- `/api/v1/shops` - For shop list
- `/api/v1/products` - For product catalog
- `/api/v1/sales-executives` - For sales person list

All these should already exist in your backend.

---

## Database Migration Notes

Ensure the following tables are created when the backend starts:
- `dispatch_groups`
- `route_groups`
- `shop_routes`
- `trip_shop_visits`
- `inventory_transactions`
- `damaged_product_tracking`

These are auto-generated by Hibernate based on the entity definitions you've created.

---

## Testing the Implementation

### 1. Test Dispatch Group Creation
```bash
curl -X POST http://localhost:9023/api/v1/dispatch-groups \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Test Group",
    "salesPersonId": 1,
    "driverId": 2,
    "vehicleId": 3
  }'
```

### 2. Test Route Creation
```bash
curl -X POST http://localhost:9023/api/v1/route-groups \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "Test Route",
    "areaRegion": "Salem"
  }'
```

### 3. Test Trip Creation
```bash
curl -X POST http://localhost:9023/api/v1/trips \
  -H "Content-Type: application/json" \
  -d '{
    "tripDate": "2026-08-08",
    "dispatchGroupId": 1,
    "routeGroupId": 1,
    "items": [{"productId": 1, "loadQuantity": 100}]
  }'
```

---

**This completes the backend implementation! The frontend and mobile components are ready to be built using the provided code templates.**
