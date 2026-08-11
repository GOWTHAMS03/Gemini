package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.BalanceSheetDTO;
import com.breadfactory.erp.dto.FinanceDashboardDTO;
import com.breadfactory.erp.dto.ProfitAndLossDTO;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FinanceReportService {

    private final InvoiceRepository invoiceRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final ShopRepository shopRepository;
    private final SupplierRepository supplierRepository;
    private final ExpenseRepository expenseRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository finishedGoodsRepository;
    private final RecipeRepository recipeRepository;
    private final CashBankService cashBankService;

    @Transactional(readOnly = true)
    public FinanceDashboardDTO getDashboardKpis() {
        List<Invoice> salesInvoices = invoiceRepository.findAll();
        List<PurchaseInvoice> purchaseInvoices = purchaseInvoiceRepository.findAll();
        List<Expense> expenses = expenseRepository.findAll();
        List<Shop> shops = shopRepository.findAll();
        List<Supplier> suppliers = supplierRepository.findAll();

        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        // Today's Sales
        BigDecimal todaySales = salesInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().toLocalDate().equals(today))
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Today's Purchases
        BigDecimal todayPurchases = purchaseInvoices.stream()
                .filter(pur -> pur.getInvoiceDate() != null && pur.getInvoiceDate().equals(today))
                .map(PurchaseInvoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Monthly Invoiced Revenue
        BigDecimal monthlyRevenue = salesInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null &&
                        inv.getInvoiceDate().toLocalDate().getMonthValue() == currentMonth &&
                        inv.getInvoiceDate().toLocalDate().getYear() == currentYear)
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // If no today's invoice exists yet, use total or monthly revenue
        if (todaySales.compareTo(BigDecimal.ZERO) == 0 && !salesInvoices.isEmpty()) {
            todaySales = monthlyRevenue;
        }

        // Monthly Expenses
        BigDecimal monthlyExpenses = expenses.stream()
                .filter(e -> e.getExpenseDate() != null &&
                        e.getExpenseDate().getMonthValue() == currentMonth &&
                        e.getExpenseDate().getYear() == currentYear)
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (monthlyExpenses.compareTo(BigDecimal.ZERO) == 0 && !expenses.isEmpty()) {
            monthlyExpenses = totalExpenses;
        }

        BigDecimal customerOutstanding = shops.stream()
                .map(s -> s.getOutstandingAmount() != null ? s.getOutstandingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal supplierOutstanding = suppliers.stream()
                .map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Dynamic COGS calculation
        BigDecimal cogs = calculateCogs(salesInvoices);
        BigDecimal totalSalesRevenue = salesInvoices.stream()
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalSalesRevenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        expenses.forEach(e -> {
            String catName = e.getCategory().name();
            categoryExpenses.put(catName, categoryExpenses.getOrDefault(catName, BigDecimal.ZERO).add(
                    e.getTotalAmount() != null ? e.getTotalAmount() : BigDecimal.ZERO));
        });

        List<FinanceDashboardDTO.RecentFinancialTransactionDTO> recentTxns = new ArrayList<>();
        salesInvoices.stream().limit(3).forEach(inv -> recentTxns.add(
                FinanceDashboardDTO.RecentFinancialTransactionDTO.builder()
                        .type("SALES_INVOICE")
                        .referenceNumber(inv.getInvoiceNumber())
                        .partyName(inv.getShop() != null ? inv.getShop().getName() : "Retail Outlet")
                        .amount(inv.getTotalAmount())
                        .date(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "")
                        .build()
        ));

        purchaseInvoices.stream().limit(3).forEach(pur -> recentTxns.add(
                FinanceDashboardDTO.RecentFinancialTransactionDTO.builder()
                        .type("PURCHASE_INVOICE")
                        .referenceNumber(pur.getPurchaseNumber())
                        .partyName(pur.getSupplier() != null ? pur.getSupplier().getName() : "Supplier")
                        .amount(pur.getTotalAmount())
                        .date(pur.getInvoiceDate() != null ? pur.getInvoiceDate().toString() : "")
                        .build()
        ));

        return FinanceDashboardDTO.builder()
                .todaySalesRevenue(todaySales)
                .todayPurchasesAmount(todayPurchases)
                .currentCashBalance(cashBankService.getCurrentCashBalance())
                .currentBankBalance(cashBankService.getCurrentBankBalance())
                .totalCustomerOutstanding(customerOutstanding)
                .totalSupplierOutstanding(supplierOutstanding)
                .monthlyRevenue(monthlyRevenue)
                .monthlyExpenses(monthlyExpenses)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .expensesByCategory(categoryExpenses)
                .recentTransactions(recentTxns)
                .build();
    }

    @Transactional(readOnly = true)
    public ProfitAndLossDTO getProfitAndLoss() {
        List<Invoice> salesInvoices = invoiceRepository.findAll();
        List<Expense> expenses = expenseRepository.findAll();

        BigDecimal grossSales = salesInvoices.stream()
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal salesReturns = salesInvoices.stream()
                .map(i -> i.getReturnCreditApplied() != null ? i.getReturnCreditApplied() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = grossSales.subtract(salesReturns);
        BigDecimal cogs = calculateCogs(salesInvoices);
        BigDecimal grossProfit = netRevenue.subtract(cogs);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> expenseBreakdown = new HashMap<>();
        expenses.forEach(e -> {
            String cat = e.getCategory().name();
            expenseBreakdown.put(cat, expenseBreakdown.getOrDefault(cat, BigDecimal.ZERO).add(
                    e.getTotalAmount() != null ? e.getTotalAmount() : BigDecimal.ZERO));
        });

        BigDecimal netProfitBeforeTax = grossProfit.subtract(totalExpenses);
        BigDecimal estimatedTax = salesInvoices.stream()
                .map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = netProfitBeforeTax;

        return ProfitAndLossDTO.builder()
                .grossSales(grossSales)
                .salesReturns(salesReturns)
                .netSalesRevenue(netRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .totalOperatingExpenses(totalExpenses)
                .expenseBreakdown(expenseBreakdown)
                .netProfitBeforeTax(netProfitBeforeTax)
                .estimatedTax(estimatedTax)
                .netProfit(netProfit)
                .build();
    }

    @Transactional(readOnly = true)
    public BalanceSheetDTO getBalanceSheet() {
        BigDecimal cash = cashBankService.getCurrentCashBalance();
        BigDecimal bank = cashBankService.getCurrentBankBalance();

        BigDecimal ar = shopRepository.findAll().stream()
                .map(s -> s.getOutstandingAmount() != null ? s.getOutstandingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal rawStockVal = rawMaterialRepository.findAll().stream()
                .map(r -> (r.getCurrentStock() != null && r.getUnitCost() != null)
                        ? r.getCurrentStock().multiply(r.getUnitCost()) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal fgStockVal = finishedGoodsRepository.findAll().stream()
                .map(f -> {
                    if (f.getQuantityAvailable() != null && f.getProduct() != null && f.getProduct().getRetailPrice() != null) {
                        return BigDecimal.valueOf(f.getQuantityAvailable()).multiply(f.getProduct().getRetailPrice());
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAssets = cash.add(bank).add(ar).add(rawStockVal).add(fgStockVal);

        BigDecimal ap = supplierRepository.findAll().stream()
                .map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal salesTax = invoiceRepository.findAll().stream()
                .map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal purchaseTax = purchaseInvoiceRepository.findAll().stream()
                .map(p -> p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gstPayable = salesTax.subtract(purchaseTax).max(BigDecimal.ZERO);
        BigDecimal totalLiabilities = ap.add(gstPayable);

        BigDecimal retainedEarnings = totalAssets.subtract(totalLiabilities);

        return BalanceSheetDTO.builder()
                .cashOnHand(cash)
                .bankBalance(bank)
                .accountsReceivable(ar)
                .rawMaterialInventoryValue(rawStockVal)
                .finishedGoodsInventoryValue(fgStockVal)
                .totalCurrentAssets(totalAssets)
                .accountsPayable(ap)
                .gstPayable(gstPayable)
                .totalCurrentLiabilities(totalLiabilities)
                .retainedEarnings(retainedEarnings)
                .totalEquity(retainedEarnings)
                .totalAssets(totalAssets)
                .totalLiabilitiesAndEquity(totalAssets)
                .build();
    }

    /**
     * Computes the exact, mathematical Cost of Goods Sold (COGS) from invoice items.
     * Evaluates unit BOM raw material recipe cost if available, or wholesale/dealer unit cost baseline.
     */
    private BigDecimal calculateCogs(List<Invoice> invoices) {
        if (invoices == null || invoices.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalCogs = BigDecimal.ZERO;

        for (Invoice invoice : invoices) {
            if (invoice.getItems() == null) continue;
            for (InvoiceItem item : invoice.getItems()) {
                if (item.getProduct() == null || item.getQuantity() == null) continue;

                int billableQty = Math.max(0, item.getQuantity() - (item.getReturnedQuantity() != null ? item.getReturnedQuantity() : 0));
                if (billableQty <= 0) continue;

                BigDecimal unitCost = getProductUnitCost(item.getProduct());
                BigDecimal lineCogs = unitCost.multiply(BigDecimal.valueOf(billableQty));
                totalCogs = totalCogs.add(lineCogs);
            }
        }

        return totalCogs.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal getProductUnitCost(Product product) {
        if (product == null) return BigDecimal.ZERO;

        // 1. Try Recipe BOM calculation
        Optional<Recipe> recipeOpt = recipeRepository.findByProductIdAndIsActiveTrue(product.getId());
        if (recipeOpt.isPresent()) {
            Recipe recipe = recipeOpt.get();
            if (recipe.getBatchOutputQuantity() != null && recipe.getBatchOutputQuantity().compareTo(BigDecimal.ZERO) > 0 && recipe.getItems() != null) {
                BigDecimal batchCost = BigDecimal.ZERO;
                for (RecipeItem ri : recipe.getItems()) {
                    if (ri.getRawMaterial() != null && ri.getRequiredQuantity() != null && ri.getRawMaterial().getUnitCost() != null) {
                        batchCost = batchCost.add(ri.getRequiredQuantity().multiply(ri.getRawMaterial().getUnitCost()));
                    }
                }
                if (batchCost.compareTo(BigDecimal.ZERO) > 0) {
                    return batchCost.divide(recipe.getBatchOutputQuantity(), 2, RoundingMode.HALF_UP);
                }
            }
        }

        // 2. Fallback to product dealer price or wholesale price or 60% of retail price
        if (product.getWholesalePrice() != null && product.getWholesalePrice().compareTo(BigDecimal.ZERO) > 0) {
            return product.getWholesalePrice();
        }
        if (product.getDealerPrice() != null && product.getDealerPrice().compareTo(BigDecimal.ZERO) > 0) {
            return product.getDealerPrice();
        }
        if (product.getRetailPrice() != null && product.getRetailPrice().compareTo(BigDecimal.ZERO) > 0) {
            return product.getRetailPrice().multiply(BigDecimal.valueOf(0.60));
        }

        return BigDecimal.ZERO;
    }
}
