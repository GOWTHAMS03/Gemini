import axios, { AxiosInstance } from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; userId: number; fullName: string; roles: string[] }>(
      '/auth/login',
      { username, password }
    ),
  register: (data: { username: string; password: string; fullName: string; email: string; phone: string }) =>
    api.post('/auth/register', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getKpis: () => api.get<ApiDashboardKpis>('/dashboard/kpis'),
  getAnalytics: () => api.get<ApiDashboardAnalytics>('/dashboard/analytics'),
};

// ─── Trips ────────────────────────────────────────────────────────────────────

export interface ApiTrip {
  id: number;
  tripNumber: string;
  routeName: string;
  status: 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  dispatchTime: string;
  returnTime?: string;
  driver: { id: number; fullName: string; username: string; phone: string };
  vehicle: { id: number; vehicleNumber: string; model: string; capacityKg: number };
  loadedItems: Array<{
    productId: number;
    productName: string;
    loadedQuantity: number;
    soldQuantity: number;
    returnedQuantity: number;
    damagedQuantity: number;
  }>;
  deliveryStops: Array<{
    deliveryId: number;
    deliveryNumber: string;
    shopName: string;
    ownerName: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    status: 'PENDING' | 'DELIVERED' | 'FAILED';
    deliveryTime?: string;
  }>;
  totalStops: number;
  completedStops: number;
  pendingStops: number;
}

export interface TripDispatchPayload {
  driverId: number;
  vehicleId: number;
  routeName: string;
  items: Array<{ productId: number; loadedQuantity: number }>;
}

export const tripApi = {
  getAll: () => api.get<ApiTrip[]>('/trips'),
  getById: (id: number) => api.get<ApiTrip>(`/trips/${id}`),
  getActiveForDriver: (driverId: number) =>
    api.get<ApiTrip>(`/trips/driver/${driverId}/active`),
  getActiveForSalesPerson: (salesPersonId: number) =>
    api.get<ApiTrip>(`/trips/sales/${salesPersonId}/active`),
  getHistoryForDriver: (driverId: number) =>
    api.get<ApiTrip[]>(`/trips/driver/${driverId}/history`),
  dispatch: (payload: TripDispatchPayload | number) => 
    typeof payload === 'number' 
      ? api.post<ApiTrip>(`/trips/${payload}/dispatch`)
      : api.post<ApiTrip>('/trips/dispatch', payload),
  startTrip: (id: number) => api.post<ApiTrip>(`/trips/${id}/start`),
  completeTrip: (id: number) => api.post<ApiTrip>(`/trips/${id}/complete`),
  updateStatus: (id: number, status: string) => api.put<ApiTrip>(`/trips/${id}/status?status=${status}`),
  delete: (id: number) => api.delete(`/trips/${id}`),
};

// ─── Deliveries ───────────────────────────────────────────────────────────────

export interface AcknowledgePayload {
  deliveryId: number;
  acceptedQuantity: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  digitalSignatureUrl?: string;
  photoProofUrl?: string;
  latitude?: number;
  longitude?: number;
  verifiedByShopUserId?: number;
}

export const deliveryApi = {
  acknowledge: (payload: AcknowledgePayload) =>
    api.post('/deliveries/acknowledge', payload),
  getForTrip: (tripId: number) =>
    api.get(`/deliveries/trip/${tripId}`),
  getPendingForDriver: (driverId: number) =>
    api.get(`/deliveries/driver/${driverId}/pending`),
};

// ─── Collections / Settlements ────────────────────────────────────────────────

export interface ApiCollection {
  id: number;
  collectionCode: string;
  tripId: number;
  tripNumber: string;
  driverId: number;
  driverName: string;
  cashCollected: number;
  upiCollected: number;
  chequeCollected: number;
  expectedTotal: number;
  actualTotal: number;
  shortageExcess: number;
  settlementStatus: 'PENDING' | 'SETTLED' | 'DISCREPANCY' | 'PENDING_AUDIT';
  settledAt?: string;
  createdAt: string;
}

export interface SettlePayload {
  tripId: number;
  driverId: number;
  cashCollected: number;
  upiCollected: number;
  chequeCollected: number;
}

export const collectionApi = {
  getAll: () => api.get<ApiCollection[]>('/collections'),
  settle: (payload: SettlePayload) =>
    api.post<ApiCollection>('/collections/settle', payload),
  getForTrip: (tripId: number) =>
    api.get<ApiCollection>(`/collections/trip/${tripId}`),
  getForDriver: (driverId: number) =>
    api.get<ApiCollection[]>(`/collections/driver/${driverId}`),
  delete: (id: number) => api.delete(`/collections/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ApiProduct {
  id: number;
  productCode: string;
  name: string;
  barcode: string;
  imageUrl?: string;
  weightGrams: number;
  mrp: number;
  minimumSellingPrice?: number;
  dealerPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  category: string;
  shelfLifeDays: number;
}

export const productApi = {
  getAll: () => api.get<ApiProduct[]>('/products'),
  getById: (id: number) => api.get<ApiProduct>(`/products/${id}`),
  create: (data: Omit<ApiProduct, 'id'>) => api.post<ApiProduct>('/products', data),
  update: (id: number, data: Partial<ApiProduct>) => api.put<ApiProduct>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export interface CloudinaryDlDocument {
  name: string;
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  bytes: number;
  created_at: string;
  folder: string;
}

export interface CloudinaryDlListResponse {
  folder: string;
  count: number;
  documents: CloudinaryDlDocument[];
}

export const mediaApi = {
  uploadDriverDl: (file: File, driverName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (driverName) formData.append('driverName', driverName);
    return api.post<{
      secure_url: string;
      url: string;
      public_id: string;
      format: string;
      bytes: number;
      folder: string;
      original_filename?: string;
    }>('/drivers/upload-dl', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDriverDlDocuments: () =>
    api.get<CloudinaryDlListResponse>('/drivers/dl-documents'),
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return api.post<{
      secure_url: string;
      url: string;
      public_id: string;
      format: string;
      bytes: number;
    }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const pricingApi = {
  calculate: (data: { productId: number; shopId?: number; customerType?: string; requestedPrice?: number; quantity?: number }) =>
    api.post('/pricing/calculate', data),
  getForBuyer: (productId: number, buyerId: number, quantity?: number) =>
    api.get(`/pricing/product/${productId}/buyer/${buyerId}${quantity ? `?quantity=${quantity}` : ''}`),
};

// ─── Product Categories ───────────────────────────────────────────────────────

export interface ApiCategory {
  id: number;
  code: string;
  name: string;
  slug?: string;
  hsnCode?: string;
  gstRate?: string;
  itemCount?: number;
  color?: string;
  status?: string;
  subCategories?: string[];
}

export const categoryApi = {
  getAll: () => api.get<ApiCategory[]>('/categories'),
  getById: (id: number) => api.get<ApiCategory>(`/categories/${id}`),
  create: (data: Omit<ApiCategory, 'id'>) => api.post<ApiCategory>('/categories', data),
  update: (id: number, data: Partial<ApiCategory>) => api.put<ApiCategory>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// ─── Delivery Routes ─────────────────────────────────────────────────────────

export interface ApiRouteShop {
  id: number;
  shopId: number;
  shopCode: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  visitOrder: number;
  latitude?: number;
  longitude?: number;
  distanceFromPrevKm?: number;
}

export interface ApiShop {
  id: number;
  shopCode: string;
  name: string;
  ownerName: string;
  phone: string;
  gstin?: string;
  address: string;
  areaName?: string;
  routeName?: string;
  customerType?: 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER';
  discountPercent?: number;
  outstandingAmount: number;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const shopApi = {
  getAll: () => api.get<ApiShop[]>('/shops?all=true'),
  getMap: () => api.get<ApiShop[]>('/shops/map'),
  getById: (id: number) => api.get<ApiShop>(`/shops/${id}`),
  create: (data: Partial<ApiShop>) => api.post<ApiShop>('/shops', data),
  update: (id: number, data: Partial<ApiShop>) => api.put<ApiShop>(`/shops/${id}`, data),
  delete: (id: number) => api.delete(`/shops/${id}`),
};

export interface RouteWaypointDto {
  shopId: number;
  shopCode: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  areaName?: string;
  visitOrder: number;
  latitude?: number;
  longitude?: number;
  distanceFromPrevKm?: number;
  estimatedMinutesFromPrev?: number;
}

export interface RouteMapResponse {
  routeId: number;
  routeCode: string;
  routeName: string;
  startingHub?: string;
  startLatitude?: number;
  startLongitude?: number;
  startLocationName?: string;
  endLatitude?: number;
  endLongitude?: number;
  endLocationName?: string;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  isOutdated?: boolean;
  shops: RouteWaypointDto[];
  geometryGeojson?: number[][];
  encodedPolyline?: string;
}

export interface RouteOptimizationPreviewResponse {
  routeId: number;
  routeCode: string;
  routeName: string;
  currentDistanceKm: number;
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  percentageSaved: number;
  estimatedDurationMinutes: number;
  currentOrder: RouteWaypointDto[];
  suggestedOrder: RouteWaypointDto[];
  geometryGeojson?: number[][];
  encodedPolyline?: string;
  explanation: string;
  missingLocationShops: RouteWaypointDto[];
  hasMissingLocations: boolean;
}

export interface ApiDeliveryRoute {
  id: number;
  routeCode: string;
  routeName: string;
  description?: string;
  startingHub?: string;
  startLatitude?: number;
  startLongitude?: number;
  startLocationName?: string;
  endLatitude?: number;
  endLongitude?: number;
  endLocationName?: string;
  assignedDriver?: string;
  driverPhone?: string;
  assignedVehicle?: string;
  totalShops?: number;
  totalDistanceKm?: number;
  distanceKm?: number;
  dispatchTime?: string;
  estimatedDuration?: string;
  estimatedDurationMinutes?: number;
  isOutdated?: boolean;
  optimizedOrderApplied?: boolean;
  geometryGeojson?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  shops?: ApiRouteShop[];
}

export const routeApi = {
  getAll: () => api.get<ApiDeliveryRoute[]>('/routes'),
  getById: (id: number) => api.get<ApiDeliveryRoute>(`/routes/${id}`),
  getMap: (id: number) => api.get<RouteMapResponse>(`/routes/${id}/map`),
  create: (data: Partial<ApiDeliveryRoute> & { shopIds?: number[] }) => api.post<ApiDeliveryRoute>('/routes', data),
  update: (id: number, data: Partial<ApiDeliveryRoute> & { shopIds?: number[] }) => api.put<ApiDeliveryRoute>(`/routes/${id}`, data),
  delete: (id: number) => api.delete(`/routes/${id}`),
  addShops: (routeId: number, shopIds: number[]) => api.post<ApiDeliveryRoute>(`/routes/${routeId}/shops`, { shopIds }),
  removeShop: (routeId: number, shopId: number) => api.delete<ApiDeliveryRoute>(`/routes/${routeId}/shops/${shopId}`),
  reorderShops: (routeId: number, shopIds: number[]) => api.put<ApiDeliveryRoute>(`/routes/${routeId}/shops/order`, { shopIds }),
};

export const routeOptimizationApi = {
  getRouteMap: (routeId: number) => api.get<RouteMapResponse>(`/routes/${routeId}/map`),
  previewOptimization: (routeId: number, data?: { shopIds?: number[]; startLatitude?: number; startLongitude?: number; endLatitude?: number; endLongitude?: number }) =>
    api.post<RouteOptimizationPreviewResponse>(`/routes/${routeId}/optimize`, data),
  applyOptimization: (routeId: number, shopIds: number[]) =>
    api.put<ApiDeliveryRoute>(`/routes/${routeId}/optimize/apply`, shopIds),
};

export const tripRouteApi = {
  getRoute: (tripId: number) => api.get<RouteMapResponse>(`/trips/${tripId}/route`),
  verifyProximity: (tripId: number, shopId: number, data: { driverLatitude: number; driverLongitude: number; radiusMeters?: number }) =>
    api.post<{ shopId: number; shopName: string; distanceMeters: number; isWithinRadius: boolean; status: string; message: string }>(
      `/trips/${tripId}/verify-proximity?shopId=${shopId}`,
      data
    ),
};


// ─── Raw Materials ────────────────────────────────────────────────────────────

export interface ApiRawMaterial {
  id: number;
  materialCode: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockAlert: number;
  unitCost: number;
  supplierName: string;
}

export const rawMaterialApi = {
  getAll: () => api.get<ApiRawMaterial[]>('/raw-materials'),
  getById: (id: number) => api.get<ApiRawMaterial>(`/raw-materials/${id}`),
  create: (data: Omit<ApiRawMaterial, 'id'>) => api.post<ApiRawMaterial>('/raw-materials', data),
  update: (id: number, data: Partial<ApiRawMaterial>) =>
    api.put<ApiRawMaterial>(`/raw-materials/${id}`, data),
  restock: (id: number, quantity: number) => api.post<ApiRawMaterial>(`/raw-materials/${id}/restock`, { quantity }),
  delete: (id: number) => api.delete(`/raw-materials/${id}`),
};

export interface ApiSupplier {
  id: number;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  outstandingBalance?: number;
}

export const suppliersApi = {
  getAll: () => api.get<ApiSupplier[]>('/suppliers'),
  getById: (id: number) => api.get<ApiSupplier>(`/suppliers/${id}`),
};


// (Shops types already declared above with enhanced location fields)


// ─── Invoices ─────────────────────────────────────────────────────────────────

export interface ApiInvoice {
  id: number;
  invoiceNumber: string;
  shopName?: string;
  customerType?: 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER';
  discountPercent?: number;
  discountAmount?: number;
  driverName?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  returnCreditApplied?: number;
  netPayableAmount?: number;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'CHEQUE';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  invoiceDate?: string;
  items: Array<{
    id: number;
    product?: { id: number; name: string };
    productId?: number;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    returnedQuantity?: number;
  }>;
}

export interface InvoiceCreatePayload {
  tripId?: number;
  shopId: number;
  customerType?: string;
  discountPercent?: number;
  discountAmount?: number;
  items: Array<{ productId: number; quantity: number; unitPrice: number }>;
  paymentMode: string;
}

export const invoiceApi = {
  getAll: () => api.get<ApiInvoice[]>('/invoices'),
  getById: (id: number) => api.get<ApiInvoice>(`/invoices/${id}`),
  create: (data: InvoiceCreatePayload) => api.post<ApiInvoice>('/invoices', data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
};

// ─── Production ───────────────────────────────────────────────────────────────

export interface ProductionRunPayload {
  productId: number;
  plannedQuantity: number;
  batchNumber: string;
  shift: string;
  operatorName: string;
  machineId: string;
  recipeId?: number;
}

export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type ProductionStage = 
  | 'STAGE_1_PREP_BAKE_COOL'
  | 'STAGE_2_SLICE_PACK_STACK'
  | 'STAGE_3_ROLL_PACKAGING'
  | 'STAGE_COMPLETED'
  | 'STAGE_DISPENSING'
  | 'STAGE_MIXING'
  | 'STAGE_DIVIDING'
  | 'STAGE_PROOFING'
  | 'STAGE_BAKING'
  | 'STAGE_COOLING_PACKING'
  | 'STAGE_QC_RELEASE';

export type ProductionShift = 'MORNING_SHIFT' | 'AFTERNOON_SHIFT' | 'NIGHT_SHIFT';

export interface BOMItemDTO {
  rawMaterialId: number;
  materialCode: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  availableStock: number;
  isSufficient: boolean;
  unitCost: number;
  totalCost: number;
}

export interface ProductionRunDTO {
  id: number;
  runNumber: string;
  batchNumber: string;
  productId: number;
  productCode?: string;
  productName: string;
  productCategory?: string;
  shelfLifeDays?: number;
  recipeId?: number;
  recipeName?: string;
  plannedQuantity: number;
  actualProducedQuantity: number;
  rejectedQuantity: number;
  wasteQuantity: number;
  yieldPercentage: number;
  status: ProductionStatus;
  currentStage: ProductionStage;
  shift: ProductionShift;
  machineUsed: string;
  operatorId?: number;
  operatorName: string;
  targetDoughWeightKg?: number;
  actualDoughWeightKg?: number;
  bakingTempCelsius?: number;
  bakingTimeMinutes?: number;
  defectReason?: string;
  defectNotes?: string;
  qcInspectorName?: string;
  isQcPassed?: boolean;
  unitCost?: number;
  totalProductionCost?: number;
  notes?: string;
  startTime?: string;
  endTime?: string;
  stage1StartTime?: string;
  stage1EndTime?: string;
  stage1Completed?: boolean;
  stage2StartTime?: string;
  stage2EndTime?: string;
  stage2Completed?: boolean;
  stage3StartTime?: string;
  stage3EndTime?: string;
  stage3Completed?: boolean;
  boxCount?: number;
  unitsPerBox?: number;
  bundleCount?: number;
  unitsPerBundle?: number;
  coverCount?: number;
  unitsPerCover?: number;
  tinCount?: number;
  looseUnits?: number;
  packagingType?: string;
  packagingNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  bomItems?: BOMItemDTO[];
}

export interface ProductionKpisResponse {
  totalRunsToday: number;
  activeBatches: number;
  completedBatches: number;
  plannedOutputTotal: number;
  actualOutputTotal: number;
  averageYieldPercentage: number;
  totalRejectedLoaves: number;
  totalWasteKg: number;
  oeeEfficiencyPercentage: number;
  totalMaterialCost: number;
}

export interface BOMPreviewResponse {
  productId: number;
  productName: string;
  recipeId?: number;
  recipeName?: string;
  requestedQuantity: number;
  recipeBatchSize: number;
  scalingRatio: number;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  allIngredientsSufficient: boolean;
  ingredients: BOMItemDTO[];
}

export const productionApi = {
  getAll: (status?: string, stage?: string, search?: string) => 
    api.get<ProductionRunDTO[]>('/production', { 
      params: { 
        status: status && status !== 'ALL' ? status : undefined, 
        stage: stage && stage !== 'ALL' ? stage : undefined,
        search: search || undefined
      } 
    }),
  getById: (id: number) => api.get<ProductionRunDTO>(`/production/${id}`),
  getKPIs: () => api.get<ProductionKpisResponse>('/production/kpis'),
  getBOMPreview: (productId: number, quantity: number = 1000) => 
    api.get<BOMPreviewResponse>('/production/bom-preview', { params: { productId, quantity } }),
  createPlan: (data: {
    productId: number;
    recipeId?: number;
    plannedQuantity: number;
    machineUsed?: string;
    operatorId?: number;
    shift?: ProductionShift;
    targetDoughWeightKg?: number;
    bakingTempCelsius?: number;
    bakingTimeMinutes?: number;
    notes?: string;
  }) => api.post<ProductionRunDTO>('/production/plan', data),
  startRun: (id: number) => api.post<ProductionRunDTO>(`/production/start/${id}`),
  startStage: (id: number, stageNumber: number) => 
    api.post<ProductionRunDTO>(`/production/${id}/start-stage/${stageNumber}`),
  completeStage: (id: number, stageNumber: number, data?: {
    notes?: string;
    bakingTempCelsius?: number;
    bakingTimeMinutes?: number;
    actualDoughWeightKg?: number;
  }) => api.post<ProductionRunDTO>(`/production/${id}/complete-stage/${stageNumber}`, data),
  savePackaging: (id: number, data: {
    boxCount?: number;
    unitsPerBox?: number;
    bundleCount?: number;
    unitsPerBundle?: number;
    coverCount?: number;
    unitsPerCover?: number;
    tinCount?: number;
    looseUnits?: number;
    packagingType?: string;
    packagingNotes?: string;
  }) => api.post<ProductionRunDTO>(`/production/${id}/packaging`, data),
  advanceStage: (id: number, data: {
    targetStage: ProductionStage;
    actualDoughWeightKg?: number;
    bakingTempCelsius?: number;
    bakingTimeMinutes?: number;
    notes?: string;
  }) => api.post<ProductionRunDTO>(`/production/${id}/advance-stage`, data),
  pauseRun: (id: number) => api.post<ProductionRunDTO>(`/production/pause/${id}`),
  completeRun: (id: number, data: {
    actualProduced: number;
    rejectedQuantity?: number;
    wasteQuantity?: number;
    defectReason?: string;
    defectNotes?: string;
    qcInspectorName?: string;
    isQcPassed?: boolean;
    notes?: string;
  }) => api.post<ProductionRunDTO>(`/production/complete/${id}`, data),
  cancelRun: (id: number) => api.post<ProductionRunDTO>(`/production/cancel/${id}`),
};

// ─── Returns & Credit Notes ──────────────────────────────────────────────────

export interface ApiSalesReturn {
  id: number;
  returnNumber: string;
  originalInvoiceId: number;
  originalInvoiceNumber: string;
  shopId: number;
  shopName: string;
  subtotal: number;
  taxAmount: number;
  totalReturnAmount: number;
  reason: string;
  returnDate: string;
  creditNoteNumber: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    returnedQuantity: number;
    originalUnitPrice: number;
    totalCreditAmount: number;
  }>;
}

export interface ApiCreditNote {
  id: number;
  creditNoteNumber: string;
  salesReturnId: number;
  returnNumber: string;
  shopId: number;
  shopName: string;
  totalAmount: number;
  appliedAmount: number;
  remainingAmount: number;
  status: 'ISSUED' | 'PARTIALLY_APPLIED' | 'FULLY_APPLIED' | 'CANCELLED';
  issuedAt: string;
}

export interface ApiShopLedger {
  id: number;
  shopId: number;
  shopName: string;
  transactionType: 'INVOICE' | 'RETURN' | 'CREDIT_NOTE_ISSUED' | 'CREDIT_NOTE_APPLIED' | 'PAYMENT' | 'ADJUSTMENT';
  referenceNumber: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  description: string;
  createdAt: string;
}

export interface ApiExpiredProduct {
  id: number;
  shopId: number;
  shopName: string;
  productId: number;
  productName: string;
  salesReturnId?: number;
  returnNumber?: string;
  quantity: number;
  originalUnitPrice: number;
  totalLossValue: number;
  disposalStatus: 'COLLECTED_BY_DRIVER' | 'RETURNED_TO_FACTORY' | 'DISPOSED' | 'RECYCLED';
  mfgDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export const returnsApi = {
  getAll: () => api.get<ApiSalesReturn[]>('/returns'),
  getByShop: (shopId: number) => api.get<ApiSalesReturn[]>(`/returns/shop/${shopId}`),
  getEligibleInvoices: (shopId: number) => api.get<ApiInvoice[]>(`/returns/eligible-invoices/${shopId}`),
  create: (data: {
    originalInvoiceId: number;
    shopId: number;
    driverId?: number;
    tripId?: number;
    reason?: string;
    items: Array<{ originalInvoiceItemId: number; productId: number; returnedQuantity: number }>;
  }) => api.post<ApiSalesReturn>('/returns', data),
  processReplacement: (data: any) => api.post('/returns/replacement-billing', data),
  delete: (id: number) => api.delete(`/returns/${id}`),
};

export const creditNotesApi = {
  getAll: () => api.get<ApiCreditNote[]>('/credit-notes'),
  getActiveByShop: (shopId: number) => api.get<ApiCreditNote[]>(`/credit-notes/shop/${shopId}/active`),
};

export const ledgersApi = {
  getShopLedger: (shopId: number) => api.get<ApiShopLedger[]>(`/ledgers/shop/${shopId}`),
  getStockLedger: (productId?: number) => api.get(`/ledgers/stock${productId ? `?productId=${productId}` : ''}`),
  getExpiredTracking: (shopId?: number) => api.get<ApiExpiredProduct[]>(`/ledgers/expired${shopId ? `?shopId=${shopId}` : ''}`),
};

// ─── Finance & Billing ────────────────────────────────────────────────────────

export interface ApiPurchaseInvoice {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName?: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  freightCharges: number;
  additionalCharges: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  paymentMode?: string;
  notes?: string;
  items: Array<{
    id: number;
    rawMaterialId: number;
    rawMaterialName?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export interface ApiExpense {
  id: number;
  expenseNumber: string;
  category: 'SALARIES' | 'FUEL' | 'VEHICLE_MAINTENANCE' | 'ELECTRICITY' | 'RENT' | 'OFFICE' | 'PACKAGING' | 'MISCELLANEOUS';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  payeeName?: string;
  expenseDate: string;
  referenceNumber?: string;
  description?: string;
  createdAt: string;
}

export interface ApiCashBankTransaction {
  id: number;
  transactionNumber: string;
  accountType: 'CASH' | 'BANK';
  transactionType: 'CASH_IN' | 'CASH_OUT' | 'BANK_DEPOSIT' | 'BANK_WITHDRAWAL' | 'TRANSFER';
  amount: number;
  referenceType?: string;
  referenceNumber?: string;
  runningCashBalance?: number;
  runningBankBalance?: number;
  reconciliationStatus?: string;
  notes?: string;
  createdAt: string;
}

export interface ApiFinanceDashboard {
  selectedPeriod?: string;
  periodSalesRevenue?: number;
  periodPurchasesAmount?: number;
  todaySalesRevenue: number;
  todayPurchasesAmount: number;
  currentCashBalance: number;
  currentBankBalance: number;
  totalCustomerOutstanding: number;
  totalSupplierOutstanding: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  grossProfit: number;
  netProfit: number;
  workingCapital?: number;
  grossProfitMarginPct?: number;
  netProfitMarginPct?: number;
  expensesByCategory: Record<string, number>;
  recentTransactions: Array<{
    type: string;
    referenceNumber: string;
    partyName: string;
    amount: number;
    date: string;
  }>;
}

export interface ApiProfitAndLoss {
  startDate?: string;
  endDate?: string;
  grossSales: number;
  salesReturns?: number;
  customerDiscounts?: number;
  netSalesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMarginPct?: number;
  totalOperatingExpenses: number;
  expenseBreakdown: Record<string, number>;
  operatingProfit?: number;
  operatingProfitMarginPct?: number;
  netProfitBeforeTax: number;
  estimatedTax: number;
  netProfit: number;
  netProfitMarginPct?: number;
}

export interface ApiBalanceSheet {
  asOfDate?: string;
  cashOnHand: number;
  bankBalance: number;
  accountsReceivable: number;
  rawMaterialInventoryValue: number;
  finishedGoodsInventoryValue: number;
  totalCurrentAssets: number;
  accountsPayable: number;
  gstPayable: number;
  totalCurrentLiabilities: number;
  workingCapital?: number;
  ownersCapital?: number;
  retainedEarnings: number;
  totalEquity: number;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  isBalanced?: boolean;
}

export interface ApiCashFlow {
  startDate?: string;
  endDate?: string;
  cashFromSalesInvoices: number;
  cashFromCustomerDebtors: number;
  totalOperatingCashInflow: number;
  cashPaidForRawMaterials: number;
  cashPaidForExpensesAndSalaries: number;
  cashPaidForGst: number;
  totalOperatingCashOutflow: number;
  netOperatingCashFlow: number;
  openingCashAndBank: number;
  closingCashAndBank: number;
  netTreasuryChange: number;
}

export interface ApiTrialBalance {
  asOfDate?: string;
  accounts: Array<{
    accountCode: string;
    accountName: string;
    accountType: string;
    debitBalance: number;
    creditBalance: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface ApiGstTaxInvoiceItem {
  invoiceNumber: string;
  partyName: string;
  gstin: string;
  date: string;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  type: string;
}

export interface ApiGstSummary {
  startDate?: string;
  endDate?: string;
  totalTaxableSales: number;
  totalOutputGst: number;
  outputCgst: number;
  outputSgst: number;
  totalTaxablePurchases: number;
  totalInputTaxCredit: number;
  inputCgst: number;
  inputSgst: number;
  netGstPayable: number;
  itcCarryForward: number;
  salesTaxInvoices: ApiGstTaxInvoiceItem[];
  purchaseTaxInvoices: ApiGstTaxInvoiceItem[];
}

export interface ApiJournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  referenceType?: string;
  referenceNumber?: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  lines: Array<{
    id: number;
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    memo?: string;
  }>;
}

export const purchasesApi = {
  getAll: () => api.get<ApiPurchaseInvoice[]>('/purchases'),
  getBySupplier: (supplierId: number) => api.get<ApiPurchaseInvoice[]>(`/purchases/supplier/${supplierId}`),
  create: (data: any) => api.post<ApiPurchaseInvoice>('/purchases', data),
  paySupplier: (data: { supplierId: number; purchaseInvoiceId?: number; amount: number; paymentMode: string; referenceNumber?: string; description?: string }) =>
    api.post('/purchases/pay-supplier', data),
  delete: (id: number) => api.delete(`/purchases/${id}`),
};

export const purchaseReturnsApi = {
  getAll: () => api.get('/purchase-returns'),
  create: (data: any) => api.post('/purchase-returns', data),
};

export const expensesApi = {
  getAll: () => api.get<ApiExpense[]>('/expenses'),
  getByCategory: (category: string) => api.get<ApiExpense[]>(`/expenses/category/${category}`),
  create: (data: any) => api.post<ApiExpense>('/expenses', data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
};

export const cashBankApi = {
  getTransactions: () => api.get<ApiCashBankTransaction[]>('/cash-bank/transactions'),
  getBalances: () => api.get<{ cashBalance: number; bankBalance: number }>('/cash-bank/balances'),
  recordTransaction: (data: any) => api.post<ApiCashBankTransaction>('/cash-bank/transaction', data),
  recordTransfer: (data: { fromAccount: string; toAccount: string; amount: number; referenceNumber?: string; notes?: string }) =>
    api.post<ApiCashBankTransaction>('/cash-bank/transfer', data),
  executeDailyClosing: (data: { closingDate?: string; actualCashCounted: number; notes?: string }) =>
    api.post('/cash-bank/daily-closing', data),
};

export interface ApiSupplierLedger {
  id: number;
  supplierId: number;
  supplierName?: string;
  transactionType: 'PURCHASE_INVOICE' | 'PURCHASE_RETURN' | 'PAYMENT_MADE' | 'ADJUSTMENT';
  referenceNumber: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  description?: string;
  createdAt: string;
}

export const supplierLedgersApi = {
  getLedger: (supplierId: number) => api.get<ApiSupplierLedger[]>(`/supplier-ledgers/supplier/${supplierId}`),
};

export interface ApiSalesExecutive {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  mobileAccessEnabled: boolean;
  permissions: string[];
  createdAt?: string;
}

export const salesExecutiveApi = {
  getAll: () => api.get<ApiSalesExecutive[]>('/users/sales-executives'),
  create: (data: { username: string; password: string; fullName: string; email?: string; phone?: string; isActive?: boolean; mobileAccessEnabled?: boolean; permissions?: string[] }) =>
    api.post<ApiSalesExecutive>('/users/sales-executives', data),
  update: (id: number, data: Partial<ApiSalesExecutive> & { password?: string }) =>
    api.put<ApiSalesExecutive>(`/users/sales-executives/${id}`, data),
  delete: (id: number) => api.delete(`/users/sales-executives/${id}`),
};

export const recipeApi = {
  getAll: () => api.get('/recipes'),
  getById: (id: number) => api.get(`/recipes/${id}`),
  create: (data: any) => api.post('/recipes', data),
  update: (id: number, data: any) => api.put(`/recipes/${id}`, data),
  delete: (id: number) => api.delete(`/recipes/${id}`),
};

export const financeReportsApi = {
  getDashboard: (period?: string) => api.get<ApiFinanceDashboard>(`/finance/dashboard${period ? `?period=${period}` : ''}`),
  getProfitAndLoss: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return api.get<ApiProfitAndLoss>(`/finance/reports/profit-and-loss${qs ? `?${qs}` : ''}`);
  },
  getBalanceSheet: (asOfDate?: string) => api.get<ApiBalanceSheet>(`/finance/reports/balance-sheet${asOfDate ? `?asOfDate=${asOfDate}` : ''}`),
  getCashFlow: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return api.get<ApiCashFlow>(`/finance/reports/cash-flow${qs ? `?${qs}` : ''}`);
  },
  getTrialBalance: (asOfDate?: string) => api.get<ApiTrialBalance>(`/finance/reports/trial-balance${asOfDate ? `?asOfDate=${asOfDate}` : ''}`),
  getGstSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return api.get<ApiGstSummary>(`/finance/reports/gst-summary${qs ? `?${qs}` : ''}`);
  },
  getJournalEntries: () => api.get<ApiJournalEntry[]>('/finance/reports/journal-entries'),
};

export interface ApiDashboardKpis {
  todayProductionUnits: number;
  todaySalesRevenue: number;
  activeDispatchesCount: number;
  completedDeliveriesCount: number;
  totalVehiclesCount: number;
  totalPendingPayments: number;
  lowStockAlertsCount: number;
  lowStockItemsDescription: string;
  expiringBatchesCount: number;
  productionEfficiencyPercentage: number;
  productionChangePercentage: number;
  salesChangePercentage: number;
  fleetDispatchPercentage: number;
}

export interface ApiDashboardAnalytics {
  productionVelocity: {
    time: string;
    actual: number;
    target: number;
    sales: number;
  }[];
  weeklyRevenue: {
    day: string;
    revenue: number;
    target: number;
    orderCount: number;
  }[];
  machineEfficiency: {
    name: string;
    actualOutput: number;
    targetOutput: number;
    efficiency: number;
    color: string;
  }[];
  rawMaterialStocks: {
    name: string;
    currentStock: number;
    minStock: number;
    fillPercent: number;
    isLow: boolean;
  }[];
  routeCoverageShare: {
    name: string;
    value: number;
    count: number;
    totalOutlets: number;
    color: string;
  }[];
}

// ─── Employees (Unified Staff Management) ─────────────────────────────────

export interface ApiEmployee {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  mobileAccessEnabled: boolean;
  permissions: string[];
  roles: string[];
  department?: string;
  designation?: string;
  basicSalary?: number;
  joiningDate?: string;
  // Driver-specific
  emergencyContact?: string;
  assignedVehicle?: string;
  primaryRoute?: string;
  dlNumber?: string;
  dlExpiryDate?: string;
  dlDocumentUrl?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  policeVerificationStatus?: string;
  createdAt?: string;
}

export interface EmployeeCreatePayload {
  username: string;
  password?: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  mobileAccessEnabled?: boolean;
  permissions?: string[];
  roleGroup: string; // "DRIVER" | "SALES_EXECUTIVE" | "EMPLOYEE"
  department?: string;
  designation?: string;
  basicSalary?: number;
  joiningDate?: string;
  // Driver-specific
  emergencyContact?: string;
  assignedVehicle?: string;
  primaryRoute?: string;
  dlNumber?: string;
  dlExpiryDate?: string;
  dlDocumentUrl?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  policeVerificationStatus?: string;
}

export const employeeApi = {
  getAll: (role?: string) =>
    api.get<ApiEmployee[]>('/users/employees', { params: role ? { role } : undefined }),
  getById: (id: number) => api.get<ApiEmployee>(`/users/employees/${id}`),
  create: (data: EmployeeCreatePayload) =>
    api.post<ApiEmployee>('/users/employees', data),
  update: (id: number, data: Partial<EmployeeCreatePayload>) =>
    api.put<ApiEmployee>(`/users/employees/${id}`, data),
  toggleStatus: (id: number) =>
    api.patch<ApiEmployee>(`/users/employees/${id}/toggle-status`),
  delete: (id: number) => api.delete(`/users/employees/${id}`),
};

// ─── Employee Salary Management ──────────────────────────────────────────

export interface ApiEmployeeSalary {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeUsername: string;
  role: string;
  department?: string;
  designation?: string;
  salaryMonth: string;
  basicSalary: number;
  allowanceAmount: number;
  deductionAmount: number;
  tripBetaAmount: number;
  otherExpenses: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  expenseId?: number;
  expenseNumber?: string;
  notes?: string;
  processedBy?: string;
  paidBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryCreatePayload {
  employeeId: number;
  salaryMonth: string;
  basicSalary?: number;
  allowanceAmount?: number;
  deductionAmount?: number;
  tripBetaAmount?: number;
  otherExpenses?: number;
  notes?: string;
}

export interface SalaryPayPayload {
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ApiEmployeeSalaryHistory {
  employeeId: number;
  employeeName: string;
  role: string;
  history: ApiEmployeeSalary[];
  totalPaidYtd: number;
  totalPending: number;
}

export interface ApiSalaryExpenseDashboard {
  selectedMonth: string;
  totalEmployees: number;
  totalDrivers: number;
  totalSalesPersons: number;
  totalOtherStaff: number;
  totalMonthlySalary: number;
  totalSalaryPaid: number;
  totalSalaryPending: number;
  paidEmployeesCount: number;
  pendingEmployeesCount: number;
  totalTripsInMonth: number;
  totalBetaPaidTrips: number;
  totalBetaAllocated: number;
  totalBetaPaid: number;
  totalBetaPending: number;
  otherTripExpenses: number;
  grandTotalEmployeeExpense: number;
  expenseBreakdownByCategory: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    salaryExpense: number;
    betaExpense: number;
    otherExpenses: number;
    totalExpense: number;
  }>;
}

export const salaryApi = {
  getAll: (month?: string, role?: string) =>
    api.get<ApiEmployeeSalary[]>('/salaries', { params: { month, role } }),
  getById: (id: number) => api.get<ApiEmployeeSalary>(`/salaries/${id}`),
  createOrUpdate: (data: SalaryCreatePayload) => api.post<ApiEmployeeSalary>('/salaries', data),
  processMonthly: (month: string, role?: string) =>
    api.post<ApiEmployeeSalary[]>('/salaries/process', { salaryMonth: month, role }),
  paySalary: (id: number, data: SalaryPayPayload) =>
    api.post<ApiEmployeeSalary>(`/salaries/${id}/pay`, data),
  getHistory: (employeeId: number) =>
    api.get<ApiEmployeeSalaryHistory>(`/salaries/employee/${employeeId}/history`),
  getDashboard: (month?: string) =>
    api.get<ApiSalaryExpenseDashboard>('/salaries/dashboard', { params: { month } }),
};

// ─── Trip Beta, Live Truck Inventory & EOD Settlement ────────────────────

export interface ApiTripBeta {
  tripId: number;
  tripNumber: string;
  dispatchGroupId?: number;
  dispatchGroupName?: string;
  driverId: number;
  driverName: string;
  salesPersonId?: number;
  salesPersonName?: string;
  vehicleNumber: string;
  betaAmount: number;
  betaPaymentStatus: 'PENDING' | 'PAID';
  betaPaymentMode?: string;
  betaPaidDate?: string;
  betaExpenseId?: number;
  betaExpenseNumber?: string;
  notes?: string;
}

export interface LiveTruckItem {
  productId: number;
  productCode: string;
  productName: string;
  mrp: number;
  unitPrice: number;
  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  remainingQuantity: number;
  totalSaleAmount: number;
}

export interface ApiTripLiveInventory {
  tripId: number;
  tripNumber: string;
  tripDate: string;
  routeName: string;
  driverName: string;
  salesPersonName: string;
  vehicleNumber: string;
  totalLoadedQuantity: number;
  totalSoldQuantity: number;
  totalReturnedQuantity: number;
  totalDamagedQuantity: number;
  totalRemainingQuantity: number;
  items: LiveTruckItem[];
}

export interface ProductReconciliationItem {
  productId: number;
  productName: string;
  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  expectedRemainingQuantity: number;
  actualRemainingQuantity: number;
  variance: number;
  status: 'MATCHED' | 'VARIANCE';
}

export interface ApiTripFinancialSummary {
  tripId: number;
  tripNumber: string;
  tripDate: string;
  routeName: string;
  status: string;
  dispatchGroupId?: number;
  dispatchGroupName?: string;
  driverId: number;
  driverName: string;
  salesPersonId?: number;
  salesPersonName?: string;
  vehicleNumber: string;
  totalLoaded: number;
  totalSold: number;
  totalReturned: number;
  totalDamaged: number;
  totalRemaining: number;
  productReconciliations: ProductReconciliationItem[];
  totalInvoices: number;
  totalSalesAmount: number;
  cashSalesAmount: number;
  upiSalesAmount: number;
  creditSalesAmount: number;
  cashCollected: number;
  upiCollected: number;
  totalCollected: number;
  collectionVariance: number;
  betaAmount: number;
  betaPaymentStatus: 'PENDING' | 'PAID';
  otherTripExpenses: number;
  totalTripExpense: number;
  settlementStatus: 'PENDING' | 'SETTLED' | 'DISCREPANCY';
  eodCompleted: boolean;
  eodSubmittedAt?: string;
  eodNotes?: string;
  settledBy?: string;
}

export interface EodSettlementPayload {
  cashCollected: number;
  upiCollected: number;
  actualProductCounts?: Array<{
    productId: number;
    actualRemainingCount: number;
    varianceReason?: string;
  }>;
  notes?: string;
}

export interface ApiDispatchGroupDetail {
  groupId: number;
  groupName: string;
  description?: string;
  vehicleNumber: string;
  vehicleModel: string;
  driverId: number;
  driverName: string;
  driverPhone: string;
  driverMonthlySalary: number;
  salesPersonId?: number;
  salesPersonName?: string;
  salesPersonPhone?: string;
  salesPersonMonthlySalary: number;
  tripHistory: Array<{
    tripId: number;
    tripNumber: string;
    tripDate: string;
    routeName: string;
    salesAmount: number;
    betaAmount: number;
    betaStatus: 'PENDING' | 'PAID';
    tripStatus: string;
    settlementStatus: string;
  }>;
  currentTrip?: ApiTripFinancialSummary;
}

export const tripBetaApi = {
  getBeta: (tripId: number) => api.get<ApiTripBeta>(`/trips/${tripId}/beta`),
  configureBeta: (tripId: number, data: { betaAmount: number; notes?: string }) =>
    api.post<ApiTripBeta>(`/trips/${tripId}/beta`, data),
  payBeta: (tripId: number, data: { paymentMode: string; amount?: number; referenceNumber?: string; notes?: string }) =>
    api.post<ApiTripBeta>(`/trips/${tripId}/beta/pay`, data),
};

export const tripSettlementApi = {
  getLiveInventory: (tripId: number) => api.get<ApiTripLiveInventory>(`/trips/${tripId}/inventory`),
  getSummary: (tripId: number) => api.get<ApiTripFinancialSummary>(`/trips/${tripId}/summary`),
  submitEod: (tripId: number, data: EodSettlementPayload) =>
    api.post<ApiTripFinancialSummary>(`/trips/${tripId}/eod`, data),
  getTripDashboardKpis: () => api.get<any>('/trips/dashboard/kpis'),
};

export interface DispatchGroupDTO {
  id: number;
  groupName: string;
  description?: string;
  salesPersonId?: number;
  salesPersonName?: string;
  driverId?: number;
  driverName?: string;
  vehicleId?: number;
  vehicleNumber?: string;
  status?: string;
  isActive?: boolean;
}

export const dispatchGroupApi = {
  getAll: () => api.get<DispatchGroupDTO[]>('/dispatch-groups'),
  getById: (id: number) => api.get<DispatchGroupDTO>(`/dispatch-groups/${id}`),
  create: (data: any) => api.post<DispatchGroupDTO>('/dispatch-groups', data),
  update: (id: number, data: any) => api.put<DispatchGroupDTO>(`/dispatch-groups/${id}`, data),
  delete: (id: number) => api.delete<void>(`/dispatch-groups/${id}`),
};

export const dispatchGroupDetailsApi = {
  getDetails: (groupId: number) =>
    api.get<ApiDispatchGroupDetail>(`/dispatch-groups/${groupId}/details`),
};

export interface ApiVehicle {
  id: number;
  vehicleCode: string;
  vehicleNumber: string;
  model: string;
  type: string;
  capacityKg: number;
  status: 'ACTIVE_DISPATCHED' | 'AVAILABLE' | 'MAINTENANCE';
  assignedDriver?: string;
  driverPhone?: string;
  assignedRoute?: string;
  fitnessExpiry?: string;
  insuranceNo?: string;
  insuranceExpiry?: string;
  pucCertificateNo?: string;
  pucExpiry?: string;
  complianceBadge?: string;
  rcDocumentName?: string;
  isActive?: boolean;
}

export const vehicleApi = {
  getAll: () => api.get<ApiVehicle[]>('/vehicles'),
  getById: (id: number) => api.get<ApiVehicle>(`/vehicles/${id}`),
  create: (data: Partial<ApiVehicle>) => api.post<ApiVehicle>('/vehicles', data),
  update: (id: number, data: Partial<ApiVehicle>) => api.put<ApiVehicle>(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
};

// ─── Weekly Trip Plan ─────────────────────────────────────────────────────────

export interface ApiWeeklyPlanCreate {
  dispatchGroupId: number;
  weekStartDate: string;
  weekEndDate: string;
  notes?: string;
}

export interface ApiMemberInfo {
  id: number;
  fullName: string;
  phone: string;
  role: string;
}

export interface ApiVehicleInfo {
  id: number;
  registrationNumber: string;
  vehicleType: string;
}

export interface ApiDailyShop {
  id: number;
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  visitSequence: number;
  visitStatus: string;
  expectedVisitTime: string;
  actualArrivalTime: string;
  actualDepartureTime: string;
  notes: string;
  orderAmount: number;
  paymentCollected: number;
  distanceFromPrevKm: number;
}

export interface ApiDailyTrip {
  id: number;
  tripDate: string;
  dayOfWeek: string;
  routeId: number | null;
  routeName: string | null;
  status: string;
  totalShops: number;
  totalDistanceKm: number;
  estimatedDuration: string;
  startTime: string;
  completionTime: string;
  notes: string;
  shops: ApiDailyShop[];
}

export interface ApiWeeklyPlan {
  id: number;
  planNumber: string;
  dispatchGroupId: number;
  dispatchGroupName: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  year: number;
  status: string;
  totalShops: number;
  totalDistanceKm: number;
  notes: string;
  publishedAt: string;
  publishedBy: string;
  createdAt: string;
  salesPersons: ApiMemberInfo[];
  driver: ApiMemberInfo | null;
  vehicle: ApiVehicleInfo | null;
  dailyTrips: ApiDailyTrip[];
}

export const weeklyPlanApi = {
  getAll: () => api.get<ApiWeeklyPlan[]>('/weekly-plans'),
  getById: (id: number) => api.get<ApiWeeklyPlan>(`/weekly-plans/${id}`),
  create: (data: ApiWeeklyPlanCreate) => api.post<ApiWeeklyPlan>('/weekly-plans', data),
  update: (id: number, data: ApiWeeklyPlanCreate) => api.put<ApiWeeklyPlan>(`/weekly-plans/${id}`, data),
  assignRoute: (planId: number, day: string, data: { routeId: number; shopIds?: number[] }) =>
    api.put<ApiDailyTrip>(`/weekly-plans/${planId}/daily-trips/${day}/route`, data),
  updateShops: (planId: number, day: string, data: { shops: { shopId: number; visitSequence: number; expectedVisitTime?: string }[] }) =>
    api.put<ApiDailyTrip>(`/weekly-plans/${planId}/daily-trips/${day}/shops`, data),
  publish: (id: number) => api.post<ApiWeeklyPlan>(`/weekly-plans/${id}/publish`),
  cancel: (id: number) => api.post<ApiWeeklyPlan>(`/weekly-plans/${id}/cancel`),
  delete: (id: number) => api.delete(`/weekly-plans/${id}`),
  duplicate: (id: number, targetWeekStartDate?: string) =>
    api.post<ApiWeeklyPlan>(`/weekly-plans/${id}/duplicate${targetWeekStartDate ? `?targetWeekStartDate=${targetWeekStartDate}` : ''}`),
};

export interface ApiFactoryResponse {
  id: number;
  factoryCode: string;
  factoryName: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPerson: string;
  contactPhone: string;
  dailyCapacityBags: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'EXPANSION' | 'INACTIVE';
  isActive: boolean;
  createdAt: string;
  vehicleCount: number;
  activeVehicleCount: number;
  rawMaterialTypesCount: number;
  totalRawMaterialStock: number;
  totalRawMaterialValue: number;
  finishedGoodsTypesCount: number;
  totalFinishedGoodsStock: number;
  totalFinishedGoodsValue: number;
}

export interface ApiFactoryOverviewSummary {
  totalFactories: number;
  operationalFactories: number;
  totalVehiclesAssigned: number;
  activeVehiclesCount: number;
  totalRawMaterialLines: number;
  totalRawMaterialValuation: number;
  totalFinishedGoodsUnits: number;
  totalFinishedGoodsValuation: number;
  totalDailyCapacityBags: number;
  factories: ApiFactoryResponse[];
}

export interface ApiFactoryDetailBreakdown {
  factory: ApiFactoryResponse;
  vehicles: {
    id: number;
    vehicleNumber: string;
    model: string;
    vehicleType: string;
    capacityTons: number;
    driverName: string;
    status: string;
  }[];
  rawMaterials: {
    id: number;
    itemCode: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    minStockLevel: number;
    unitPrice: number;
    totalValue: number;
    status: string;
  }[];
  finishedGoods: {
    id: number;
    productCode: string;
    productName: string;
    category: string;
    availableQuantity: number;
    unitPrice: number;
    totalValue: number;
    batchCode: string;
  }[];
}

export const factoryApi = {
  getAll: () => api.get<ApiFactoryResponse[]>('/factories'),
  getOverview: () => api.get<ApiFactoryOverviewSummary>('/factories/overview'),
  getById: (id: number) => api.get<ApiFactoryDetailBreakdown>(`/factories/${id}`),
  create: (data: Partial<ApiFactoryResponse>) => api.post<ApiFactoryResponse>('/factories', data),
  update: (id: number, data: Partial<ApiFactoryResponse>) => api.put<ApiFactoryResponse>(`/factories/${id}`, data),
  delete: (id: number) => api.delete(`/factories/${id}`),
};

export interface InventoryDashboardDTO {
  totalFinishedGoodsUnits: number;
  totalFinishedGoodsValue: number;
  totalTransitFleetUnits: number;
  totalTransitFleetValue: number;
  totalRawMaterialCount: number;
  totalRawMaterialValue: number;
  nearExpiryBatchCount: number;
  lowStockProductCount: number;
  todayProductionUnits: number;
  todaySalesUnits: number;
  nearExpiryItems: NearExpiryItemDTO[];
  lowStockAlerts: LowStockAlertDTO[];
}

export interface NearExpiryItemDTO {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  batchNumber: string;
  warehouseName: string;
  quantityAvailable: number;
  mfgDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  unitPrice: number;
  totalValue: number;
}

export interface LowStockAlertDTO {
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  currentStock: number;
  reorderThreshold: number;
  status: string;
}

export interface FinishedGoodsItemDTO {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  imageUrl?: string;
  batchNumber: string;
  warehouseId?: number;
  warehouseName?: string;
  quantityAvailable: number;
  mfgDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  mrp: number;
  wholesalePrice: number;
  totalValuation: number;
}

export interface TransitStockItemDTO {
  tripId: number;
  tripNumber: string;
  vehicleNumber: string;
  driverName: string;
  routeName: string;
  tripStatus: string;
  productId: number;
  productName: string;
  productCode: string;
  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  availableOnVan: number;
  unitPrice: number;
  totalVanStockValue: number;
}

export interface StockLedgerItemDTO {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  movementType: string;
  quantity: number;
  batchNumber?: string;
  referenceNumber?: string;
  warehouseName?: string;
  tripNumber?: string;
  shopName?: string;
  notes?: string;
  createdAt: string;
}

export interface TruckInventoryDTO {
  vehicleId: number;
  vehicleCode: string;
  vehicleNumber: string;
  model: string;
  type: string;
  capacityKg: number;
  assignedDriver: string;
  driverPhone?: string;
  assignedRoute?: string;
  tripId?: number;
  tripNumber: string;
  tripStatus: string;
  totalLoadedUnits: number;
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalDamagedUnits: number;
  totalAvailableUnits: number;
  totalWeightKg: number;
  payloadCapacityPercentage: number;
  totalStockValue: number;
  items: TruckInventoryItemDTO[];
}

export interface TruckInventoryItemDTO {
  id?: number;
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  weightGrams: number;
  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  lineTotalValue: number;
  centralWarehouseStock: number;
}

export interface TruckRefillPayload {
  vehicleId?: number;
  vehicleNumber?: string;
  driverName?: string;
  notes?: string;
  items: {
    productId: number;
    quantityToRefill: number;
  }[];
}

export interface TruckAuditPayload {
  vehicleId: number;
  tripId?: number;
  notes?: string;
  items: {
    productId: number;
    actualPhysicalCount: number;
    damagedCount: number;
    expiredCount?: number;
  }[];
}

export interface StockAdjustmentPayload {
  productId: number;
  warehouseId?: number;
  batchNumber?: string;
  adjustedQuantity: number;
  reason?: string;
  notes?: string;
}

export const inventoryApi = {
  getDashboard: () => api.get<InventoryDashboardDTO>('/inventory/dashboard'),
  getFinishedGoods: (productId?: number, warehouseId?: number) => 
    api.get<FinishedGoodsItemDTO[]>('/inventory/finished-goods', { params: { productId, warehouseId } }),
  getTransitStock: () => api.get<TransitStockItemDTO[]>('/inventory/transit-stock'),
  getTruckInventories: () => api.get<TruckInventoryDTO[]>('/inventory/trucks'),
  refillTruck: (payload: TruckRefillPayload) => api.post<TruckInventoryDTO>('/inventory/trucks/refill', payload),
  auditTruckStock: (payload: TruckAuditPayload) => api.post<TruckInventoryDTO>('/inventory/trucks/audit', payload),
  getStockLedger: (productId?: number, movementType?: string) => 
    api.get<StockLedgerItemDTO[]>('/inventory/ledger', { params: { productId, movementType } }),
  adjustStock: (payload: StockAdjustmentPayload) => api.post<FinishedGoodsItemDTO>('/inventory/adjust', payload),
};

export const salesDeliveryApi = {
  clearAll: () => api.delete<Record<string, any>>('/sales-delivery/clear-all'),
};

export default api;




