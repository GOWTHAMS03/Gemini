import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CustomSelect } from '../components/common';

interface ShopRoute {
  id: number;
  shopName: string;
  shopCode?: string;
  address?: string;
  visitDay: number;
  visitSequence: number;
  expectedVisitTime?: string;
  isActive: boolean;
}

interface RouteGroup {
  id: number;
  routeName: string;
  areaRegion: string;
  isActive: boolean;
  description?: string;
  shopRoutes: ShopRoute[];
}

interface Shop {
  id: number;
  name: string;
  shopCode: string;
  address?: string;
}

export const RouteGroupPage = () => {
  const [routes, setRoutes] = useState<RouteGroup[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteGroup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showShopForm, setShowShopForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);

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

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchRoutes();
    fetchShops();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/route-groups');
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      alert('Failed to fetch routes');
    } finally {
      setLoading(false);
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
    if (!formData.routeName || !formData.areaRegion) {
      alert('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/v1/route-groups', formData);
      fetchRoutes();
      setShowForm(false);
      setFormData({ routeName: '', description: '', areaRegion: '' });
      alert('Route created successfully!');
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute || !shopFormData.shopId) {
      alert('Please select a shop');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/v1/route-groups/${selectedRoute.id}/shops`, shopFormData);
      fetchRoutes();
      // Refresh selected route
      const updated = routes.find(r => r.id === selectedRoute.id);
      if (updated) setSelectedRoute(updated);
      setShowShopForm(false);
      setShopFormData({ shopId: '', visitDay: 0, visitSequence: 1, expectedVisitTime: '' });
      alert('Shop added to route successfully!');
    } catch (error) {
      console.error('Error adding shop:', error);
      alert('Failed to add shop to route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Route Groups</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          New Route
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Route Group</h2>
          <form onSubmit={handleCreateRoute} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Name *</label>
              <input
                type="text"
                placeholder="Route Name (e.g., Salem South Route)"
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
                rows={2}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area/Region *</label>
              <input
                type="text"
                placeholder="Area/Region (e.g., Salem)"
                value={formData.areaRegion}
                onChange={(e) => setFormData({ ...formData, areaRegion: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Route'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Route List ({routes.length})</h2>
          <div className="space-y-2">
            {routes.length === 0 ? (
              <p className="text-gray-500">No routes found</p>
            ) : (
              routes.map(route => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedRoute?.id === route.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <p className="font-bold text-gray-900 dark:text-white">{route.routeName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{route.areaRegion}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{route.shopRoutes.length} shops</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Route Detail */}
        <div className="lg:col-span-2">
          {selectedRoute && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRoute.routeName}</h2>
                <button
                  onClick={() => setShowShopForm(!showShopForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Add Shop
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Area: {selectedRoute.areaRegion}</p>
              {selectedRoute.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedRoute.description}</p>
              )}

              {showShopForm && (
                <form onSubmit={handleAddShop} className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop</label>
                    <CustomSelect
                      value={shopFormData.shopId}
                      onChange={val => setShopFormData({ ...shopFormData, shopId: val })}
                      options={[
                        { value: '', label: 'Select Shop' },
                        ...shops.map(shop => ({
                          value: shop.id,
                          label: `${shop.name} (${shop.shopCode})`,
                          badge: shop.shopCode
                        }))
                      ]}
                      placeholder="Select Shop"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day</label>
                    <CustomSelect
                      value={shopFormData.visitDay}
                      onChange={val => setShopFormData({ ...shopFormData, visitDay: parseInt(val) })}
                      options={dayNames.map((day, idx) => ({
                        value: idx,
                        label: day,
                        badge: `DAY ${idx + 1}`
                      }))}
                      placeholder="Select Day"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sequence</label>
                    <input
                      type="number"
                      placeholder="Visit Sequence"
                      value={shopFormData.visitSequence}
                      onChange={(e) => setShopFormData({ ...shopFormData, visitSequence: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white p-2 rounded"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (optional)</label>
                    <input
                      type="time"
                      placeholder="Expected Visit Time"
                      value={shopFormData.expectedVisitTime}
                      onChange={(e) => setShopFormData({ ...shopFormData, expectedVisitTime: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white p-2 rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Shop'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShopForm(false)}
                      className="ml-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Assigned Shops ({selectedRoute.shopRoutes.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Shop</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Day</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Sequence</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoute.shopRoutes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-gray-500">No shops assigned</td>
                        </tr>
                      ) : (
                        selectedRoute.shopRoutes
                          .sort((a, b) => a.visitSequence - b.visitSequence)
                          .map(shopRoute => (
                            <tr key={shopRoute.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-2 text-gray-900 dark:text-white">{shopRoute.shopName}</td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{dayNames[shopRoute.visitDay]}</td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{shopRoute.visitSequence}</td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{shopRoute.expectedVisitTime || '-'}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {!selectedRoute && (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
              <p className="text-gray-500 dark:text-gray-400">Select a route to view and manage shops</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteGroupPage;
