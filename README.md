# Enterprise B2B Product Tracking & Production Management System (Bread Factory ERP)

## Overview
This repository contains a complete enterprise-grade B2B Supply Chain & Manufacturing ERP system tailored for commercial bread and bakery manufacturing factories. The system provides end-to-end visibility from raw material procurement, BOM recipe formulation, batch production execution, truck dispatch stock transfers, field van sales, shopkeeper digital delivery acknowledgements (POD), driver collection reconciliation, to automated financial ledgers.

---

## Technical Stack Architecture

### 1. Backend (`/backend`)
- **Framework**: Spring Boot 3.2.3, Java 21
- **Security**: Spring Security with JWT Tokens & Role-Based Access Control (RBAC)
- **Database**: PostgreSQL 16 Engine with Flyway DDL Migrations
- **Cache & Realtime**: Redis 7, Spring WebSocket / SSE Streams
- **Documentation**: OpenAPI 3 / Swagger UI (`/swagger-ui.html`)

### 2. Admin Web Dashboard (`/admin-dashboard`)
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Glassmorphic UI aesthetics, Dark Mode
- **Charts & Data**: Recharts, Lucide Icons, Redux Toolkit
- **Routing**: React Router v6

### 3. Mobile Application (`/mobile-app`)
- **Framework**: Flutter 3.x / Dart
- **Target Roles**: Delivery Drivers, Field Sales Representatives, Shop Owners
- **Features**: Assigned Route Dashboard, Digital Signature Canvas, Proof of Delivery (POD) photo logs, Offline Sync Queue

### 4. Containerization & Infrastructure
- `docker-compose.yml` hosting PostgreSQL, Redis, Java API Service, and React Admin Dashboard Nginx Web Server.

---

## Database ERD & Data Model
The database is fully normalized with primary keys, composite indexes, soft delete tracking, and audit columns (`created_at`, `updated_at`, `deleted_at`).

Core Entities:
- **`raw_materials` & `recipes`**: Ingredient inventories and Bill of Materials (BOM) target ratios.
- **`production_runs`**: Production batch logs with dynamic raw material auto-deduction matrix.
- **`finished_goods_inventory`**: Warehouse batch stock with manufacturing & expiry tracking.
- **`vehicles` & `trips`**: Fleet trucks treated as virtual mobile warehouses.
- **`deliveries` & `delivery_acknowledgements`**: Field proof of delivery with digital signatures & geo-coordinates.
- **`invoices` & `driver_collections`**: Spot sales invoices, payment modes (Cash, UPI, Credit), and driver daily reconciliation (shortage/excess calculation).

---

## How to Run locally

### Option 1: Running with Docker Compose (Recommended)
```bash
# Launch PostgreSQL, Redis, Backend API, and React Web Dashboard
docker-compose up --build
```
- **React Admin Web**: `http://localhost:3000`
- **Spring Boot API**: `http://localhost:9023/api/v1`
- **Swagger Documentation**: `http://localhost:9023/api/v1/swagger-ui.html`

### Option 2: Running Backend Locally
```bash
cd backend
mvn spring-boot:run
```

### Option 3: Running Admin Dashboard Locally
```bash
cd admin-dashboard
npm install
npm run dev
```

### Option 4: Running Mobile App
```bash
cd mobile-app
flutter run
```

---

## Enterprise Features Implemented
1. **Automated Production Raw Material Deduction**: Completing a production run automatically computes required ingredient ratios based on active BOM recipes and deducts raw stock transactions atomically.
2. **Mobile Truck Inventory Management**: Stock allocated to delivery trucks updates internal warehouse transfer logs.
3. **Proof of Delivery (POD) & Digital Signature**: Digital signature canvas capture and photo proof verification for shop deliveries.
4. **Driver Daily Settlement Engine**: End-of-day cash and UPI collection reconciliation calculating exact shortage/excess against total invoices issued.
