export interface DashboardKpis {
  todayProductionUnits: number;
  todaySalesRevenue: number;
  activeDispatchesCount: number;
  completedDeliveriesCount: number;
  totalPendingPayments: number;
  lowStockAlertsCount: number;
  expiringBatchesCount: number;
  productionEfficiencyPercentage: number;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  barcode: string;
  weightGrams: number;
  mrp: number;
  dealerPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  category: string;
  shelfLifeDays: number;
}

export interface RawMaterial {
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

export interface ProductionRun {
  id: number;
  runNumber: string;
  productName: string;
  plannedQuantity: number;
  actualProducedQuantity: number;
  rejectedQuantity: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  batchNumber: string;
  startTime: string;
}

export interface Trip {
  id: number;
  tripNumber: string;
  driverName: string;
  vehicleNumber: string;
  routeName: string;
  status: 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  dispatchTime: string;
  itemsCount: number;
}

export type CustomerType = 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER';

export interface Shop {
  id: number;
  shopCode: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  routeName: string;
  customerType?: CustomerType;
  discountPercent?: number;
  outstandingAmount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  shopName: string;
  customerType?: CustomerType;
  discountPercent?: number;
  discountAmount?: number;
  driverName: string;
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'CHEQUE';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  invoiceDate: string;
}
