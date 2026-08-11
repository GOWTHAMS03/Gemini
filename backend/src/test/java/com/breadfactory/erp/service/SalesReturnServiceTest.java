package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.ReplacementBillingRequest;
import com.breadfactory.erp.dto.ReplacementBillingResponse;
import com.breadfactory.erp.dto.SalesReturnCreateRequest;
import com.breadfactory.erp.dto.SalesReturnResponse;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.CreditNoteStatus;
import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.enums.PaymentStatus;
import com.breadfactory.erp.enums.ShopLedgerType;
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
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SalesReturnServiceTest {

    @Mock private SalesReturnRepository salesReturnRepository;
    @Mock private CreditNoteRepository creditNoteRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private ProductRepository productRepository;
    @Mock private TripRepository tripRepository;
    @Mock private UserRepository userRepository;
    @Mock private ShopLedgerRepository shopLedgerRepository;
    @Mock private ProductStockLedgerRepository productStockLedgerRepository;
    @Mock private ExpiredProductTrackingRepository expiredProductTrackingRepository;
    @Mock private SalesInvoiceService salesInvoiceService;

    @InjectMocks
    private SalesReturnService salesReturnService;

    private Shop shopA;
    private Product breadProduct;
    private Invoice originalInvoice;
    private InvoiceItem originalInvoiceItem;

    @BeforeEach
    void setUp() {
        shopA = Shop.builder()
                .id(1L)
                .shopCode("SHOP-001")
                .name("Shop A Bakery")
                .ownerName("Owner A")
                .phone("9876543210")
                .address("Address 1")
                .outstandingAmount(BigDecimal.valueOf(350))
                .build();

        breadProduct = Product.builder()
                .id(101L)
                .productCode("PROD-001")
                .name("White Bread 400g")
                .retailPrice(BigDecimal.valueOf(35))
                .shelfLifeDays(5)
                .build();

        originalInvoiceItem = InvoiceItem.builder()
                .id(501L)
                .product(breadProduct)
                .quantity(10)
                .unitPrice(BigDecimal.valueOf(35)) // Day 1 sale price: ₹35
                .totalPrice(BigDecimal.valueOf(350))
                .returnedQuantity(0)
                .build();

        originalInvoice = Invoice.builder()
                .id(1001L)
                .invoiceNumber("INV-1001")
                .shop(shopA)
                .subtotal(BigDecimal.valueOf(350))
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.valueOf(17.50))
                .totalAmount(BigDecimal.valueOf(367.50))
                .paymentMode(PaymentMode.CREDIT)
                .paymentStatus(PaymentStatus.PENDING)
                .items(new ArrayList<>(List.of(originalInvoiceItem)))
                .build();

        originalInvoiceItem.setInvoice(originalInvoice);
    }

    @Test
    @DisplayName("Return credit should use original selling price (₹35) rather than current price")
    void testReturnCreditUsesOriginalSellingPrice() {
        when(shopRepository.findById(1L)).thenReturn(Optional.of(shopA));
        when(invoiceRepository.findById(1001L)).thenReturn(Optional.of(originalInvoice));
        when(salesReturnRepository.save(any(SalesReturn.class))).thenAnswer(i -> {
            SalesReturn sr = i.getArgument(0);
            sr.setId(10L);
            return sr;
        });
        when(creditNoteRepository.save(any(CreditNote.class))).thenAnswer(i -> {
            CreditNote cn = i.getArgument(0);
            cn.setId(20L);
            return cn;
        });

        // Request return of 2 packets expired from INV-1001
        SalesReturnCreateRequest request = SalesReturnCreateRequest.builder()
                .originalInvoiceId(1001L)
                .shopId(1L)
                .reason("EXPIRED")
                .items(List.of(
                        SalesReturnCreateRequest.ReturnItemRequest.builder()
                                .originalInvoiceItemId(501L)
                                .productId(101L)
                                .returnedQuantity(2)
                                .build()
                ))
                .build();

        SalesReturnResponse response = salesReturnService.createReturn(request);

        assertNotNull(response);
        // Subtotal = 2 * ₹35 = ₹70
        assertEquals(0, BigDecimal.valueOf(70).compareTo(response.getSubtotal()));
        // GST Tax (5%) = ₹3.50
        assertEquals(0, BigDecimal.valueOf(3.50).compareTo(response.getTaxAmount()));
        // Total Return Amount = ₹73.50
        assertEquals(0, BigDecimal.valueOf(73.50).compareTo(response.getTotalReturnAmount()));

        // Original invoice item returned quantity updated to 2
        assertEquals(2, originalInvoiceItem.getReturnedQuantity());

        // Verify Credit Note and Shop Ledger generated
        verify(creditNoteRepository, times(1)).save(any(CreditNote.class));
        verify(shopLedgerRepository, times(1)).save(argThat(ledger ->
                ledger.getTransactionType() == ShopLedgerType.CREDIT_NOTE_ISSUED &&
                ledger.getCreditAmount().compareTo(BigDecimal.valueOf(73.50)) == 0
        ));
    }

    @Test
    @DisplayName("Should throw exception if returned quantity exceeds sold quantity")
    void testReturnQuantityExceedsSoldQuantityThrowsException() {
        when(shopRepository.findById(1L)).thenReturn(Optional.of(shopA));
        when(invoiceRepository.findById(1001L)).thenReturn(Optional.of(originalInvoice));

        // Request return of 12 packets when only 10 were sold
        SalesReturnCreateRequest request = SalesReturnCreateRequest.builder()
                .originalInvoiceId(1001L)
                .shopId(1L)
                .reason("EXPIRED")
                .items(List.of(
                        SalesReturnCreateRequest.ReturnItemRequest.builder()
                                .originalInvoiceItemId(501L)
                                .productId(101L)
                                .returnedQuantity(12)
                                .build()
                ))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> salesReturnService.createReturn(request));
        assertTrue(ex.getMessage().contains("Cannot return 12 units"));
    }

    @Test
    @DisplayName("Replacement Billing: Fresh Delivery (₹380) − Return Credit (₹70) = Net Payable (₹310)")
    void testReplacementBillingNetPayableCalculation() {
        when(shopRepository.findById(1L)).thenReturn(Optional.of(shopA));
        when(invoiceRepository.findById(1001L)).thenReturn(Optional.of(originalInvoice));

        // Setup mock return creation
        when(salesReturnRepository.save(any(SalesReturn.class))).thenAnswer(i -> {
            SalesReturn sr = i.getArgument(0);
            sr.setId(10L);
            return sr;
        });

        CreditNote mockCN = CreditNote.builder()
                .id(20L)
                .creditNoteNumber("CN-TEST-001")
                .shop(shopA)
                .totalAmount(BigDecimal.valueOf(70))
                .appliedAmount(BigDecimal.ZERO)
                .remainingAmount(BigDecimal.valueOf(70))
                .status(CreditNoteStatus.ISSUED)
                .build();
        when(creditNoteRepository.save(any(CreditNote.class))).thenReturn(mockCN);
        when(creditNoteRepository.findByCreditNoteNumber(any())).thenReturn(Optional.of(mockCN));

        // Mock Fresh Invoice (10 packets @ new price ₹38 = ₹380)
        Invoice freshInvoice = Invoice.builder()
                .id(1002L)
                .invoiceNumber("INV-1002")
                .shop(shopA)
                .subtotal(BigDecimal.valueOf(380))
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(380))
                .paymentMode(PaymentMode.CASH)
                .paymentStatus(PaymentStatus.PAID)
                .items(new ArrayList<>())
                .build();
        when(salesInvoiceService.createInvoice(any())).thenReturn(freshInvoice);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        ReplacementBillingRequest req = ReplacementBillingRequest.builder()
                .shopId(1L)
                .paymentMode(PaymentMode.CASH)
                .returnRequest(SalesReturnCreateRequest.builder()
                        .originalInvoiceId(1001L)
                        .shopId(1L)
                        .reason("EXPIRED")
                        .items(List.of(
                                SalesReturnCreateRequest.ReturnItemRequest.builder()
                                        .originalInvoiceItemId(501L)
                                        .productId(101L)
                                        .returnedQuantity(2)
                                        .build()
                        ))
                        .build())
                .freshItems(List.of(
                        new com.breadfactory.erp.dto.InvoiceCreateRequest.InvoiceItemRequest(101L, 10, BigDecimal.valueOf(38))
                ))
                .build();

        ReplacementBillingResponse resp = salesReturnService.processReplacementBilling(req);

        assertNotNull(resp);
        assertEquals(0, BigDecimal.valueOf(380).compareTo(resp.getFreshDeliveryTotal()));
        assertEquals(0, BigDecimal.valueOf(70).compareTo(resp.getReturnCreditApplied()));
        assertEquals(0, BigDecimal.valueOf(310).compareTo(resp.getNetPayableAmount()));
        assertEquals(CreditNoteStatus.FULLY_APPLIED, mockCN.getStatus());
    }
}
