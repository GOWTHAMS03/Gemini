# Backend API Implementation - Quick Reference

## Endpoints to Implement

### 1. Trip Status Update
```
PATCH /api/v1/trips/{tripId}/status
Authorization: Bearer {token}

Request Body:
{
  "status": "IN_PROGRESS"  // or "COMPLETED" or "CANCELLED"
}

Response (200 OK):
{
  "id": 1,
  "tripNumber": "TRIP-001",
  "status": "IN_PROGRESS",
  "driverId": 1,
  "vehicleId": 1,
  "totalBillAmount": 150000,
  "totalPaymentAmount": 120000,
  "totalPendingAmount": 30000,
  "updatedAt": "2026-08-08T10:30:00"
}

Error Responses:
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (user doesn't have permission)
- 404: Trip not found
- 400: Invalid status value
```

---

### 2. Shop Visit Check-in
```
POST /api/v1/trips/{tripId}/shop-visits/{shopVisitId}/check-in
Authorization: Bearer {token}

Request Body:
{
  "checkInTime": "2026-08-08T09:15:00",
  "latitude": 12.9352,
  "longitude": 77.6245
}

Response (200 OK):
{
  "id": 1,
  "shopVisitId": 1,
  "tripId": 1,
  "visitSequence": 1,
  "status": "IN_PROGRESS",
  "actualStartTime": "2026-08-08T09:15:00",
  "checkInLocation": {
    "latitude": 12.9352,
    "longitude": 77.6245
  },
  "billAmount": 0,
  "paymentAmount": 0,
  "pendingAmount": 0
}

Validation:
- tripId must exist and be IN_PROGRESS status
- shopVisitId must exist and belong to the trip
- checkInTime must not be before plannedStartTime
- checkInTime must not be after current time + 5 minutes
- latitude/longitude must be valid GPS coordinates
```

---

### 3. Shop Visit Check-out (Complete Visit)
```
POST /api/v1/trips/{tripId}/shop-visits/{shopVisitId}/check-out
Authorization: Bearer {token}

Request Body:
{
  "checkOutTime": "2026-08-08T10:00:00",
  "billAmount": 25000,
  "paymentAmount": 20000,
  "pendingAmount": 5000,
  "paymentMethod": "CASH",
  "productSales": {
    "1": 95,      // productId: soldQuantity
    "2": 50,
    "3": 0
  },
  "remarks": "Customer satisfied, requested delivery next week",
  "latitude": 12.9355,
  "longitude": 77.6250
}

Response (200 OK):
{
  "id": 1,
  "tripId": 1,
  "shopVisitId": 1,
  "visitSequence": 1,
  "status": "COMPLETED",
  "actualStartTime": "2026-08-08T09:15:00",
  "actualEndTime": "2026-08-08T10:00:00",
  "checkInLocation": { "latitude": 12.9352, "longitude": 77.6245 },
  "checkOutLocation": { "latitude": 12.9355, "longitude": 77.6250 },
  "billAmount": 25000,
  "paymentAmount": 20000,
  "pendingAmount": 5000,
  "paymentMethod": "CASH",
  "products": [
    {
      "productId": 1,
      "allocatedQuantity": 100,
      "soldQuantity": 95,
      "returnedQuantity": 5,
      "damagedQuantity": 0
    },
    {
      "productId": 2,
      "allocatedQuantity": 100,
      "soldQuantity": 50,
      "returnedQuantity": 50,
      "damagedQuantity": 0
    },
    {
      "productId": 3,
      "allocatedQuantity": 50,
      "soldQuantity": 0,
      "returnedQuantity": 50,
      "damagedQuantity": 0
    }
  ],
  "remarks": "Customer satisfied, requested delivery next week",
  "updatedAt": "2026-08-08T10:00:00"
}

Validation:
- checkOutTime must be after checkInTime
- billAmount must be >= 0
- paymentAmount must be <= billAmount
- pendingAmount must equal (billAmount - paymentAmount)
- productSales keys must be valid productIds
- productSales values must not exceed allocatedQuantity
- remarks optional, max 500 characters
- latitude/longitude must be valid GPS coordinates
```

---

### 4. Trip Analytics - Trip Stats
```
GET /api/v1/analytics/trips?period=7days
Authorization: Bearer {token}

Query Parameters:
- period: "7days" | "30days" | "90days" | "all" (default: "7days")

Response (200 OK):
{
  "totalTrips": 24,
  "completedTrips": 18,
  "inProgressTrips": 3,
  "cancelledTrips": 2,
  "scheduledTrips": 1,
  "completionRate": 75.0,
  "averageTripDuration": "02:30",
  "totalShopsVisited": 156
}

Query Logic:
- Count trips by status where tripDate >= (today - period)
- completionRate = (completedTrips / totalTrips) * 100
- averageTripDuration = avg(actualEndTime - actualStartTime)
- totalShopsVisited = sum of completed shop visits
```

---

### 5. Trip Analytics - Sales Stats
```
GET /api/v1/analytics/sales?period=7days
Authorization: Bearer {token}

Query Parameters:
- period: "7days" | "30days" | "90days" | "all"

Response (200 OK):
{
  "totalSales": 1850000,
  "totalCollected": 1480000,
  "pendingCollection": 370000,
  "collectionRate": 80.0,
  "averageOrderValue": 11827.74,
  "averageOrderSize": 8.5,
  "totalProducts": 2150
}

Query Logic:
- totalSales = sum of (billAmount from all completed shop visits)
- totalCollected = sum of (paymentAmount from all completed shop visits)
- pendingCollection = sum of (pendingAmount from all completed shop visits)
- collectionRate = (totalCollected / totalSales) * 100
- averageOrderValue = totalSales / count(distinct shop visits)
```

---

### 6. Driver Analytics
```
GET /api/v1/analytics/drivers?period=7days
Authorization: Bearer {token}

Query Parameters:
- period: "7days" | "30days" | "90days" | "all"
- limit: 10 (top N drivers)

Response (200 OK):
[
  {
    "driverId": 1,
    "driverName": "Rajesh Sharma",
    "phone": "9876543210",
    "email": "rajesh@company.com",
    "tripsCompleted": 5,
    "tripsInProgress": 1,
    "totalShopsVisited": 28,
    "totalSales": 450000,
    "totalCollected": 380000,
    "pendingCollection": 70000,
    "collectionRate": 84.4,
    "completionRate": 100,
    "averageSalesPerTrip": 90000,
    "averageSalesPerShop": 16071.43,
    "averageDeliveryTime": "00:45",
    "averageShopsPerTrip": 5.6,
    "rating": 4.8
  },
  {
    "driverId": 2,
    "driverName": "Suresh Kumar",
    ...
  }
]

Query Logic:
- Order by totalSales DESC (top drivers first)
- completionRate = (completedTrips / (completedTrips + inProgressTrips)) * 100
- averageDeliveryTime = avg(trip endTime - trip startTime)
- averageShopsPerTrip = totalShopsVisited / tripsCompleted
```

---

### 7. Route Analytics
```
GET /api/v1/analytics/routes?period=7days
Authorization: Bearer {token}

Query Parameters:
- period: "7days" | "30days" | "90days" | "all"

Response (200 OK):
[
  {
    "routeId": 1,
    "routeName": "North Bangalore A",
    "shopsInRoute": 8,
    "tripsCompleted": 4,
    "tripsInProgress": 1,
    "tripsScheduled": 2,
    "shopsVisited": 32,
    "totalSales": 850000,
    "totalCollected": 680000,
    "pendingCollection": 170000,
    "collectionRate": 80.0,
    "averageSalesPerTrip": 212500,
    "averageSalesPerShop": 26562.50,
    "averageTimePerShop": "00:12",
    "averageTripsPerDay": 0.8,
    "profitability": "High"
  }
]

Query Logic:
- Order by totalSales DESC
- averageTimePerShop = sum(shop visit duration) / shopsVisited
- averageTripsPerDay = tripsCompleted / daysInPeriod
- profitability: HIGH (>15% margin), MEDIUM (10-15%), LOW (<10%)
```

---

### 8. Daily Reports
```
GET /api/v1/analytics/daily-reports?period=7days
Authorization: Bearer {token}

Query Parameters:
- period: "7days" | "30days" | "90days" | "all"

Response (200 OK):
[
  {
    "date": "2026-08-08",
    "dayName": "Thursday",
    "tripsStarted": 5,
    "tripsCompleted": 4,
    "tripsInProgress": 1,
    "tripsCancelled": 0,
    "shopsVisited": 28,
    "totalSales": 185000,
    "totalCollected": 148000,
    "pendingCollection": 37000,
    "collectionRate": 80.0,
    "averageSalesPerTrip": 46250,
    "averageSalesPerShop": 6607.14
  },
  {
    "date": "2026-08-07",
    ...
  }
]

Query Logic:
- Group by tripDate
- Include trips with status IN_PROGRESS as "started"
- Only include completed shop visits in collections
- Sort by date DESC (newest first)
```

---

### 9. Export Analytics
```
GET /api/v1/analytics/export/sales?period=7days
Authorization: Bearer {token}

Query Parameters:
- reportType: "sales" | "drivers" | "routes" | "daily"
- period: "7days" | "30days" | "90days" | "all"
- format: "csv" (default)

Response: 
- Content-Type: text/csv
- Content-Disposition: attachment; filename="sales_2026-08-08.csv"

CSV Content (sales):
Date,Trip ID,Driver Name,Route Name,Shops Visited,Bill Amount,Payment Received,Pending Amount,Collection Rate
2026-08-08,TRIP-001,Rajesh Sharma,North A,5,50000,40000,10000,80%
2026-08-08,TRIP-002,Suresh Kumar,South B,4,45000,36000,9000,80%
...

SQL Generation:
- SELECT relevant fields from trips, shop_visits, drivers, routes
- WHERE trip_date >= (today - period) AND status = 'COMPLETED'
- ORDER BY trip_date DESC
- Write to CSV format with proper escaping
```

---

## Service Implementation Template

### ShopVisitService.java
```java
@Service
@Transactional
public class ShopVisitService {
    
    @Autowired private TripShopVisitRepository shopVisitRepo;
    @Autowired private TripRepository tripRepo;
    @Autowired private InventoryTransactionRepository inventoryRepo;
    @Autowired private DamagedProductTrackingRepository damagedRepo;
    
    public TripShopVisit checkIn(Long tripId, Long shopVisitId, 
                                LocalDateTime checkInTime, 
                                Double latitude, Double longitude) {
        // Fetch trip and validate status = IN_PROGRESS
        Trip trip = tripRepo.findById(tripId).orElseThrow(...);
        if (!trip.getStatus().equals(TripStatus.IN_PROGRESS)) {
            throw new IllegalStateException("Trip is not in progress");
        }
        
        // Fetch shop visit and update
        TripShopVisit visit = shopVisitRepo.findById(shopVisitId).orElseThrow(...);
        visit.setStatus(ShopVisitStatus.IN_PROGRESS);
        visit.setActualStartTime(checkInTime);
        visit.setCheckInLatitude(latitude);
        visit.setCheckInLongitude(longitude);
        
        return shopVisitRepo.save(visit);
    }
    
    public TripShopVisit checkOut(Long tripId, Long shopVisitId,
                                 ShopVisitCheckOutDTO dto) {
        // Fetch & validate
        Trip trip = tripRepo.findById(tripId).orElseThrow(...);
        TripShopVisit visit = shopVisitRepo.findById(shopVisitId).orElseThrow(...);
        
        // Validate amounts
        if (dto.getPaymentAmount() > dto.getBillAmount()) {
            throw new IllegalArgumentException("Payment cannot exceed bill");
        }
        
        // Update visit status
        visit.setStatus(ShopVisitStatus.COMPLETED);
        visit.setActualEndTime(dto.getCheckOutTime());
        visit.setBillAmount(dto.getBillAmount());
        visit.setPaymentAmount(dto.getPaymentAmount());
        visit.setPendingAmount(dto.getPendingAmount());
        visit.setCheckOutLatitude(dto.getLatitude());
        visit.setCheckOutLongitude(dto.getLongitude());
        
        // Save product sales as InventoryTransactions
        for (Map.Entry<Long, Integer> entry : dto.getProductSales().entrySet()) {
            InventoryTransaction txn = new InventoryTransaction();
            txn.setTrip(trip);
            txn.setProduct(productRepo.findById(entry.getKey()).orElseThrow(...));
            txn.setQuantity(entry.getValue());
            txn.setType(TransactionType.SALE);
            inventoryRepo.save(txn);
        }
        
        // Update trip totals
        updateTripTotals(trip);
        
        return shopVisitRepo.save(visit);
    }
    
    private void updateTripTotals(Trip trip) {
        // Sum all shop visits to get trip totals
        List<TripShopVisit> visits = shopVisitRepo.findByTrip(trip);
        
        trip.setTotalBillAmount(
            visits.stream().mapToLong(v -> v.getBillAmount()).sum()
        );
        trip.setTotalPaymentAmount(
            visits.stream().mapToLong(v -> v.getPaymentAmount()).sum()
        );
        trip.setTotalPendingAmount(
            visits.stream().mapToLong(v -> v.getPendingAmount()).sum()
        );
        
        tripRepo.save(trip);
    }
}
```

### AnalyticsService.java
```java
@Service
public class AnalyticsService {
    
    @Autowired private TripRepository tripRepo;
    @Autowired private TripShopVisitRepository shopVisitRepo;
    @Autowired private DriverRepository driverRepo;
    
    public TripStatsDTO getTripStats(LocalDate startDate, LocalDate endDate) {
        List<Trip> trips = tripRepo.findByTripDateBetweenAndStatus(startDate, endDate);
        
        long completed = trips.stream()
            .filter(t -> t.getStatus() == TripStatus.COMPLETED).count();
        long inProgress = trips.stream()
            .filter(t -> t.getStatus() == TripStatus.IN_PROGRESS).count();
        
        TripStatsDTO stats = new TripStatsDTO();
        stats.setTotalTrips(trips.size());
        stats.setCompletedTrips(completed);
        stats.setCompletionRate((double) completed / trips.size() * 100);
        
        return stats;
    }
    
    // Similar methods for sales, drivers, routes, daily reports
    
    public String exportToCSV(String reportType, LocalDate startDate, LocalDate endDate) {
        // Generate CSV content based on report type
        // Return as String or write to file
    }
}
```

---

## Controller Implementation Template

### ShopVisitController.java
```java
@RestController
@RequestMapping("/api/v1/trips/{tripId}/shop-visits")
@PreAuthorize("hasRole('ROLE_DRIVER') or hasRole('ROLE_SALES_MANAGER')")
public class ShopVisitController {
    
    @Autowired private ShopVisitService shopVisitService;
    
    @PostMapping("/{shopVisitId}/check-in")
    public ResponseEntity<TripShopVisit> checkIn(
            @PathVariable Long tripId,
            @PathVariable Long shopVisitId,
            @RequestBody ShopVisitCheckInDTO dto) {
        return ResponseEntity.ok(
            shopVisitService.checkIn(tripId, shopVisitId, 
                                    dto.getCheckInTime(),
                                    dto.getLatitude(),
                                    dto.getLongitude())
        );
    }
    
    @PostMapping("/{shopVisitId}/check-out")
    public ResponseEntity<TripShopVisit> checkOut(
            @PathVariable Long tripId,
            @PathVariable Long shopVisitId,
            @RequestBody ShopVisitCheckOutDTO dto) {
        return ResponseEntity.ok(
            shopVisitService.checkOut(tripId, shopVisitId, dto)
        );
    }
}

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasRole('ROLE_SALES_MANAGER') or hasRole('ROLE_SUPER_ADMIN')")
public class AnalyticsController {
    
    @Autowired private AnalyticsService analyticsService;
    
    @GetMapping("/trips")
    public ResponseEntity<TripStatsDTO> getTripStats(
            @RequestParam(defaultValue = "7days") String period) {
        LocalDate startDate = getPeriodStartDate(period);
        return ResponseEntity.ok(
            analyticsService.getTripStats(startDate, LocalDate.now())
        );
    }
    
    // Similar endpoints for sales, drivers, routes, daily, export
    
    private LocalDate getPeriodStartDate(String period) {
        LocalDate today = LocalDate.now();
        return switch (period) {
            case "7days" -> today.minusDays(7);
            case "30days" -> today.minusDays(30);
            case "90days" -> today.minusDays(90);
            default -> LocalDate.of(2000, 1, 1); // All time
        };
    }
}
```

---

## Key Implementation Points

### Payment Validation
- Payment amount must be <= Bill amount
- Pending amount must equal (Bill - Payment)
- Track pending collection for follow-up

### GPS Validation
- Latitude: -90 to +90
- Longitude: -180 to +180
- Store both check-in and check-out locations
- Optional: Validate distance from shop coordinates

### Product Sales Validation
- Cannot sell more than allocated quantity
- Returned quantity = allocated - sold
- Track separately from damaged products
- Support zero sales (customer not interested)

### Status Transitions
```
Trip: SCHEDULED → IN_PROGRESS → COMPLETED | CANCELLED
ShopVisit: PENDING → IN_PROGRESS → COMPLETED
```

---

Estimated Implementation Time: **4-6 hours**
