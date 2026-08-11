package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.CreditNoteDTO;
import com.breadfactory.erp.dto.ExpiredProductDTO;
import com.breadfactory.erp.dto.ShopLedgerDTO;
import com.breadfactory.erp.entity.CreditNote;
import com.breadfactory.erp.entity.ExpiredProductTracking;
import com.breadfactory.erp.entity.ProductStockLedger;
import com.breadfactory.erp.entity.ShopLedger;
import com.breadfactory.erp.enums.CreditNoteStatus;
import com.breadfactory.erp.repository.CreditNoteRepository;
import com.breadfactory.erp.repository.ExpiredProductTrackingRepository;
import com.breadfactory.erp.repository.ProductStockLedgerRepository;
import com.breadfactory.erp.repository.ShopLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final ShopLedgerRepository shopLedgerRepository;
    private final ProductStockLedgerRepository productStockLedgerRepository;
    private final ExpiredProductTrackingRepository expiredProductTrackingRepository;
    private final CreditNoteRepository creditNoteRepository;

    @Transactional(readOnly = true)
    public List<ShopLedgerDTO> getShopLedger(Long shopId) {
        return shopLedgerRepository.findByShopIdOrderByCreatedAtAsc(shopId).stream()
                .map(this::mapShopLedger)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductStockLedger> getProductStockLedger(Long productId) {
        if (productId != null) {
            return productStockLedgerRepository.findByProductIdOrderByCreatedAtDesc(productId);
        }
        return productStockLedgerRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ExpiredProductDTO> getExpiredProductTracking(Long shopId) {
        List<ExpiredProductTracking> list = (shopId != null) 
                ? expiredProductTrackingRepository.findByShopIdOrderByCreatedAtDesc(shopId)
                : expiredProductTrackingRepository.findAllByOrderByCreatedAtDesc();

        return list.stream().map(this::mapExpiredProduct).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CreditNoteDTO> getActiveCreditNotesForShop(Long shopId) {
        return creditNoteRepository.findByShopIdAndStatusIn(shopId, Arrays.asList(CreditNoteStatus.ISSUED, CreditNoteStatus.PARTIALLY_APPLIED))
                .stream()
                .map(this::mapCreditNote)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CreditNoteDTO> getAllCreditNotes() {
        return creditNoteRepository.findAllByOrderByIssuedAtDesc().stream()
                .map(this::mapCreditNote)
                .collect(Collectors.toList());
    }

    private ShopLedgerDTO mapShopLedger(ShopLedger ledger) {
        return ShopLedgerDTO.builder()
                .id(ledger.getId())
                .shopId(ledger.getShop().getId())
                .shopName(ledger.getShop().getName())
                .transactionType(ledger.getTransactionType())
                .referenceNumber(ledger.getReferenceNumber())
                .debitAmount(ledger.getDebitAmount())
                .creditAmount(ledger.getCreditAmount())
                .runningBalance(ledger.getRunningBalance())
                .description(ledger.getDescription())
                .createdAt(ledger.getCreatedAt())
                .build();
    }

    private ExpiredProductDTO mapExpiredProduct(ExpiredProductTracking exp) {
        return ExpiredProductDTO.builder()
                .id(exp.getId())
                .shopId(exp.getShop().getId())
                .shopName(exp.getShop().getName())
                .productId(exp.getProduct().getId())
                .productName(exp.getProduct().getName())
                .salesReturnId(exp.getSalesReturn() != null ? exp.getSalesReturn().getId() : null)
                .returnNumber(exp.getSalesReturn() != null ? exp.getSalesReturn().getReturnNumber() : null)
                .quantity(exp.getQuantity())
                .originalUnitPrice(exp.getOriginalUnitPrice())
                .totalLossValue(exp.getTotalLossValue())
                .disposalStatus(exp.getDisposalStatus())
                .mfgDate(exp.getMfgDate())
                .expiryDate(exp.getExpiryDate())
                .notes(exp.getNotes())
                .createdAt(exp.getCreatedAt())
                .build();
    }

    private CreditNoteDTO mapCreditNote(CreditNote cn) {
        return CreditNoteDTO.builder()
                .id(cn.getId())
                .creditNoteNumber(cn.getCreditNoteNumber())
                .salesReturnId(cn.getSalesReturn().getId())
                .returnNumber(cn.getSalesReturn().getReturnNumber())
                .shopId(cn.getShop().getId())
                .shopName(cn.getShop().getName())
                .totalAmount(cn.getTotalAmount())
                .appliedAmount(cn.getAppliedAmount())
                .remainingAmount(cn.getRemainingAmount())
                .status(cn.getStatus())
                .issuedAt(cn.getIssuedAt())
                .build();
    }
}
