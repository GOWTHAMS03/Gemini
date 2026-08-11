package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.PurchaseReturnCreateRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.SupplierLedgerType;
import com.breadfactory.erp.repository.*;
import com.breadfactory.erp.service.AccountingAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseReturnService {

    private final PurchaseReturnRepository purchaseReturnRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final SupplierRepository supplierRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final SupplierLedgerRepository supplierLedgerRepository;
    private final AccountingAutomationService accountingService;

    @Transactional(readOnly = true)
    public List<PurchaseReturn> getAllPurchaseReturns() {
        return purchaseReturnRepository.findAllByOrderByReturnDateDesc();
    }

    @Transactional(readOnly = true)
    public List<PurchaseReturn> getPurchaseReturnsBySupplier(Long supplierId) {
        return purchaseReturnRepository.findBySupplierIdOrderByReturnDateDesc(supplierId);
    }

    @Transactional
    public PurchaseReturn createPurchaseReturn(PurchaseReturnCreateRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found: " + request.getSupplierId()));

        PurchaseInvoice originalInvoice = purchaseInvoiceRepository.findById(request.getPurchaseInvoiceId())
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + request.getPurchaseInvoiceId()));

        String returnNumber = "PRET-" + System.currentTimeMillis();

        PurchaseReturn purchaseReturn = PurchaseReturn.builder()
                .returnNumber(returnNumber)
                .purchaseInvoice(originalInvoice)
                .supplier(supplier)
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalReturnAmount(BigDecimal.ZERO)
                .reason(request.getReason() != null ? request.getReason() : "DEFECTIVE_RAW_MATERIAL")
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (PurchaseReturnCreateRequest.PurchaseReturnItemRequest itemReq : request.getItems()) {
            PurchaseInvoiceItem origItem = originalInvoice.getItems().stream()
                    .filter(i -> i.getId().equals(itemReq.getPurchaseInvoiceItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Purchase item not found: " + itemReq.getPurchaseInvoiceItemId()));

            BigDecimal prevReturned = origItem.getReturnedQuantity() != null ? origItem.getReturnedQuantity() : BigDecimal.ZERO;
            BigDecimal maxReturnable = origItem.getQuantity().subtract(prevReturned);

            if (itemReq.getReturnedQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Returned quantity must be greater than zero");
            }
            if (itemReq.getReturnedQuantity().compareTo(maxReturnable) > 0) {
                throw new IllegalArgumentException("Returned quantity exceeds remaining purchased quantity");
            }

            BigDecimal itemTotalCredit = origItem.getUnitCost().multiply(itemReq.getReturnedQuantity());
            subtotal = subtotal.add(itemTotalCredit);

            // AUTO REDUCE RAW MATERIAL STOCK
            RawMaterial material = origItem.getRawMaterial();
            BigDecimal newStock = (material.getCurrentStock() != null ? material.getCurrentStock() : BigDecimal.ZERO)
                    .subtract(itemReq.getReturnedQuantity());
            if (newStock.compareTo(BigDecimal.ZERO) < 0) newStock = BigDecimal.ZERO;
            material.setCurrentStock(newStock);
            rawMaterialRepository.save(material);

            // Update item returned quantity
            origItem.setReturnedQuantity(prevReturned.add(itemReq.getReturnedQuantity()));

            PurchaseReturnItem returnItem = PurchaseReturnItem.builder()
                    .purchaseReturn(purchaseReturn)
                    .purchaseInvoiceItem(origItem)
                    .rawMaterial(material)
                    .returnedQuantity(itemReq.getReturnedQuantity())
                    .unitCost(origItem.getUnitCost())
                    .totalCreditAmount(itemTotalCredit)
                    .build();

            purchaseReturn.getItems().add(returnItem);
        }

        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.05)); // 5% GST
        BigDecimal totalReturn = subtotal.add(tax);

        purchaseReturn.setSubtotal(subtotal);
        purchaseReturn.setTaxAmount(tax);
        purchaseReturn.setTotalReturnAmount(totalReturn);

        PurchaseReturn savedReturn = purchaseReturnRepository.save(purchaseReturn);

        // UPDATE SUPPLIER OUTSTANDING BALANCE & LEDGER
        BigDecimal currentBal = supplier.getOutstandingBalance() != null ? supplier.getOutstandingBalance() : BigDecimal.ZERO;
        BigDecimal newBal = currentBal.subtract(totalReturn);
        if (newBal.compareTo(BigDecimal.ZERO) < 0) newBal = BigDecimal.ZERO;
        supplier.setOutstandingBalance(newBal);
        supplierRepository.save(supplier);

        // Record Supplier Ledger Return Entry
        SupplierLedger ledgerEntry = SupplierLedger.builder()
                .supplier(supplier)
                .transactionType(SupplierLedgerType.PURCHASE_RETURN)
                .referenceNumber(returnNumber)
                .debitAmount(totalReturn)
                .creditAmount(BigDecimal.ZERO)
                .runningBalance(newBal)
                .description("Purchase Return issued for defective materials (Ref Invoice: " + originalInvoice.getPurchaseNumber() + ")")
                .build();
        supplierLedgerRepository.save(ledgerEntry);

        // AUTO ACCOUNTING: Debit 2000 Accounts Payable, Credit 1300 Raw Material Inventory
        accountingService.recordJournalEntry(
                "PURCHASE_RETURN", returnNumber,
                "Purchase Return to Supplier " + supplier.getName(),
                "2000", totalReturn,
                "1300", totalReturn
        );

        return savedReturn;
    }
}
