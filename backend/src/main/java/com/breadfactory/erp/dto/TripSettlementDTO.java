package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.enums.PaymentStatus;
import com.breadfactory.erp.enums.SettlementStatus;
import com.breadfactory.erp.enums.TripStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

public class TripSettlementDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BetaConfigRequest {
        private BigDecimal betaAmount;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BetaPaymentRequest {
        private PaymentMode paymentMode; // CASH, BANK_TRANSFER, UPI, CHEQUE
        private BigDecimal amount;
        private String referenceNumber;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripBetaResponse {
        private Long tripId;
        private String tripNumber;
        private Long dispatchGroupId;
        private String dispatchGroupName;
        private Long driverId;
        private String driverName;
        private Long salesPersonId;
        private String salesPersonName;
        private String vehicleNumber;
        private BigDecimal betaAmount;
        private PaymentStatus betaPaymentStatus;
        private PaymentMode betaPaymentMode;
        private ZonedDateTime betaPaidDate;
        private Long betaExpenseId;
        private String betaExpenseNumber;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiveTruckInventoryItem {
        private Long productId;
        private String productCode;
        private String productName;
        private BigDecimal mrp;
        private BigDecimal unitPrice;
        private Integer loadedQuantity;
        private Integer soldQuantity;
        private Integer returnedQuantity;
        private Integer damagedQuantity;
        private Integer remainingQuantity; // loaded - sold - returned - damaged
        private BigDecimal totalSaleAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripLiveInventoryResponse {
        private Long tripId;
        private String tripNumber;
        private LocalDate tripDate;
        private String routeName;
        private String driverName;
        private String salesPersonName;
        private String vehicleNumber;
        private Integer totalLoadedQuantity;
        private Integer totalSoldQuantity;
        private Integer totalReturnedQuantity;
        private Integer totalDamagedQuantity;
        private Integer totalRemainingQuantity;
        private List<LiveTruckInventoryItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductReconciliationItem {
        private Long productId;
        private String productName;
        private Integer loadedQuantity;
        private Integer soldQuantity;
        private Integer returnedQuantity;
        private Integer expectedRemainingQuantity; // loaded - sold - returned
        private Integer actualRemainingQuantity;
        private Integer variance; // actual - expected
        private String status; // MATCHED, VARIANCE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripFinancialSummaryResponse {
        private Long tripId;
        private String tripNumber;
        private LocalDate tripDate;
        private String routeName;
        private TripStatus status;
        
        // Dispatch Team
        private Long dispatchGroupId;
        private String dispatchGroupName;
        private Long driverId;
        private String driverName;
        private Long salesPersonId;
        private String salesPersonName;
        private String vehicleNumber;

        // Products Summary
        private Integer totalLoaded;
        private Integer totalSold;
        private Integer totalReturned;
        private Integer totalDamaged;
        private Integer totalRemaining;
        private List<ProductReconciliationItem> productReconciliations;

        // Sales & Invoices Summary
        private Integer totalInvoices;
        private BigDecimal totalSalesAmount;
        private BigDecimal cashSalesAmount;
        private BigDecimal upiSalesAmount;
        private BigDecimal creditSalesAmount;

        // Collections Summary
        private BigDecimal cashCollected;
        private BigDecimal upiCollected;
        private BigDecimal totalCollected;
        private BigDecimal collectionVariance; // totalCollected - (cashSales + upiSales)

        // Expense Summary
        private BigDecimal betaAmount;
        private PaymentStatus betaPaymentStatus;
        private BigDecimal otherTripExpenses;
        private BigDecimal totalTripExpense;

        // Settlement Status
        private SettlementStatus settlementStatus;
        private Boolean eodCompleted;
        private ZonedDateTime eodSubmittedAt;
        private String eodNotes;
        private String settledBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EodSettlementSubmitRequest {
        private BigDecimal cashCollected;
        private BigDecimal upiCollected;
        private List<ProductCountEntry> actualProductCounts;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductCountEntry {
        private Long productId;
        private Integer actualRemainingCount;
        private String varianceReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DispatchGroupDetailResponse {
        private Long groupId;
        private String groupName;
        private String description;
        private String vehicleNumber;
        private String vehicleModel;

        // Driver details & monthly salary
        private Long driverId;
        private String driverName;
        private String driverPhone;
        private BigDecimal driverMonthlySalary;

        // Sales Person details & monthly salary
        private Long salesPersonId;
        private String salesPersonName;
        private String salesPersonPhone;
        private BigDecimal salesPersonMonthlySalary;

        // Trip History
        private List<GroupTripHistoryItem> tripHistory;

        // Current Active Trip
        private TripFinancialSummaryResponse currentTrip;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupTripHistoryItem {
        private Long tripId;
        private String tripNumber;
        private LocalDate tripDate;
        private String routeName;
        private BigDecimal salesAmount;
        private BigDecimal betaAmount;
        private PaymentStatus betaStatus;
        private TripStatus tripStatus;
        private SettlementStatus settlementStatus;
    }
}
