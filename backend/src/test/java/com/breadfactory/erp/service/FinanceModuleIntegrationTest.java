package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.ExpenseCreateRequest;
import com.breadfactory.erp.dto.PurchaseInvoiceCreateRequest;
import com.breadfactory.erp.dto.PurchaseReturnCreateRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.ExpenseCategory;
import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FinanceModuleIntegrationTest {

    @Mock private PurchaseInvoiceRepository purchaseInvoiceRepository;
    @Mock private PurchaseReturnRepository purchaseReturnRepository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private RawMaterialRepository rawMaterialRepository;
    @Mock private SupplierLedgerRepository supplierLedgerRepository;
    @Mock private CashBankTransactionRepository cashBankTransactionRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private AccountingAutomationService accountingService;

    @InjectMocks private PurchaseBillingService purchaseBillingService;
    @InjectMocks private PurchaseReturnService purchaseReturnService;
    @InjectMocks private ExpenseService expenseService;

    private Supplier supplierA;
    private RawMaterial flourMaterial;

    @BeforeEach
    void setUp() {
        supplierA = Supplier.builder()
                .id(1L)
                .supplierCode("SUP-001")
                .name("Standard Mills Flour Ltd")
                .phone("9840001122")
                .outstandingBalance(BigDecimal.ZERO)
                .build();

        flourMaterial = RawMaterial.builder()
                .id(10L)
                .materialCode("RAW-001")
                .name("Refined Wheat Flour")
                .unit("KG")
                .currentStock(BigDecimal.valueOf(100))
                .unitCost(BigDecimal.valueOf(40))
                .build();
    }

    @Test
    @DisplayName("Purchase Invoice: Auto-increments raw material inventory stock & updates supplier balance")
    void testPurchaseInvoiceIncrementsRawMaterialStock() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplierA));
        when(rawMaterialRepository.findById(10L)).thenReturn(Optional.of(flourMaterial));
        when(purchaseInvoiceRepository.save(any(PurchaseInvoice.class))).thenAnswer(i -> {
            PurchaseInvoice pi = i.getArgument(0);
            pi.setId(100L);
            return pi;
        });

        PurchaseInvoiceCreateRequest request = PurchaseInvoiceCreateRequest.builder()
                .supplierId(1L)
                .paymentMode(PaymentMode.CREDIT)
                .items(List.of(
                        PurchaseInvoiceCreateRequest.PurchaseItemRequest.builder()
                                .rawMaterialId(10L)
                                .quantity(BigDecimal.valueOf(50)) // Add 50 KG
                                .unitCost(BigDecimal.valueOf(40))
                                .build()
                ))
                .build();

        PurchaseInvoice result = purchaseBillingService.createPurchaseInvoice(request);

        assertNotNull(result);
        // Initial stock 100 + 50 = 150 KG
        assertEquals(0, BigDecimal.valueOf(150).compareTo(flourMaterial.getCurrentStock()));

        // Total bill = 50 * 40 = 2000 + 5% GST (100) = 2100
        assertEquals(0, BigDecimal.valueOf(2100).compareTo(result.getTotalAmount()));
        assertEquals(0, BigDecimal.valueOf(2100).compareTo(supplierA.getOutstandingBalance()));

        verify(supplierLedgerRepository, times(1)).save(any(SupplierLedger.class));
        verify(accountingService, times(1)).recordJournalEntry(
                eq("PURCHASE_INVOICE"), anyString(), anyString(), eq("1300"),
                argThat(b -> b.compareTo(new BigDecimal("2100")) == 0),
                eq("2000"),
                argThat(b -> b.compareTo(new BigDecimal("2100")) == 0)
        );
    }

    @Test
    @DisplayName("Purchase Return: Auto-decrements raw material inventory stock & credits supplier balance")
    void testPurchaseReturnDecrementsRawMaterialStock() {
        PurchaseInvoiceItem item = PurchaseInvoiceItem.builder()
                .id(50L)
                .rawMaterial(flourMaterial)
                .quantity(BigDecimal.valueOf(50))
                .unitCost(BigDecimal.valueOf(40))
                .totalCost(BigDecimal.valueOf(2000))
                .returnedQuantity(BigDecimal.ZERO)
                .build();

        PurchaseInvoice origInvoice = PurchaseInvoice.builder()
                .id(100L)
                .purchaseNumber("PUR-1001")
                .supplier(supplierA)
                .items(new ArrayList<>(List.of(item)))
                .build();

        supplierA.setOutstandingBalance(BigDecimal.valueOf(2100));

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplierA));
        when(purchaseInvoiceRepository.findById(100L)).thenReturn(Optional.of(origInvoice));
        when(purchaseReturnRepository.save(any(PurchaseReturn.class))).thenAnswer(i -> {
            PurchaseReturn pr = i.getArgument(0);
            pr.setId(200L);
            return pr;
        });

        PurchaseReturnCreateRequest req = PurchaseReturnCreateRequest.builder()
                .purchaseInvoiceId(100L)
                .supplierId(1L)
                .reason("DEFECTIVE_BAGS")
                .items(List.of(
                        PurchaseReturnCreateRequest.PurchaseReturnItemRequest.builder()
                                .purchaseInvoiceItemId(50L)
                                .rawMaterialId(10L)
                                .returnedQuantity(BigDecimal.valueOf(10)) // Return 10 KG
                                .build()
                ))
                .build();

        PurchaseReturn result = purchaseReturnService.createPurchaseReturn(req);

        assertNotNull(result);
        // Stock 100 - 10 = 90 KG
        assertEquals(0, BigDecimal.valueOf(90).compareTo(flourMaterial.getCurrentStock()));

        // Return credit = 10 * 40 = 400 + 5% GST (20) = 420
        assertEquals(0, BigDecimal.valueOf(420).compareTo(result.getTotalReturnAmount()));

        // Supplier balance: 2100 - 420 = 1680
        assertEquals(0, BigDecimal.valueOf(1680).compareTo(supplierA.getOutstandingBalance()));
    }

    @Test
    @DisplayName("Expense Recording: Logs operational expense & records cash/bank outflow")
    void testExpenseRecording() {
        when(expenseRepository.save(any(Expense.class))).thenAnswer(i -> {
            Expense e = i.getArgument(0);
            e.setId(300L);
            return e;
        });

        ExpenseCreateRequest req = ExpenseCreateRequest.builder()
                .category(ExpenseCategory.FUEL)
                .amount(BigDecimal.valueOf(1200))
                .paymentMode(PaymentMode.CASH)
                .expenseDate(LocalDate.now())
                .description("Delivery Truck Fuel Refill")
                .build();

        Expense result = expenseService.createExpense(req);

        assertNotNull(result);
        assertEquals(0, BigDecimal.valueOf(1200).compareTo(result.getTotalAmount()));

        verify(cashBankTransactionRepository, times(1)).save(any(CashBankTransaction.class));
        verify(accountingService, times(1)).recordJournalEntry(
                eq("EXPENSE"), anyString(), anyString(), eq("5200"),
                argThat(b -> b.compareTo(new BigDecimal("1200")) == 0),
                eq("1000"),
                argThat(b -> b.compareTo(new BigDecimal("1200")) == 0)
        );
    }
}
