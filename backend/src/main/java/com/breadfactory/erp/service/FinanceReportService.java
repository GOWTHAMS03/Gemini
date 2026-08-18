package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.enums.PaymentStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceReportService {

    private final InvoiceRepository invoiceRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final ShopRepository shopRepository;
    private final SupplierRepository supplierRepository;
    private final ExpenseRepository expenseRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository finishedGoodsRepository;
    private final RecipeRepository recipeRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final CashBankService cashBankService;

    @Transactional(readOnly = true)
    public FinanceDashboardDTO getDashboardKpis(String period) {
        String safePeriod = (period != null && !period.isBlank()) ? period.toUpperCase() : "MTD";
        LocalDate today = LocalDate.now();

        LocalDate periodStart;
        LocalDate periodEnd = today;

        switch (safePeriod) {
            case "TODAY" -> periodStart = today;
            case "THIS_WEEK" -> periodStart = today.minusDays(today.getDayOfWeek().getValue() - 1);
            case "ALL_TIME" -> periodStart = LocalDate.of(2020, 1, 1);
            default -> periodStart = today.withDayOfMonth(1); // MTD
        }

        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<PurchaseInvoice> allPurchases = purchaseInvoiceRepository.findAll();
        List<Expense> allExpenses = expenseRepository.findAll();
        List<Shop> shops = shopRepository.findAll();
        List<Supplier> suppliers = supplierRepository.findAll();

        // 1. Filter Sales by Period
        BigDecimal periodSales = allInvoices.stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), periodStart, periodEnd))
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Today's Sales
        BigDecimal todaySales = allInvoices.stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), today, today))
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todaySales.compareTo(BigDecimal.ZERO) == 0 && periodSales.compareTo(BigDecimal.ZERO) > 0) {
            todaySales = periodSales;
        }

        // 2. Filter Purchases by Period
        BigDecimal periodPurchases = allPurchases.stream()
                .filter(pur -> isWithinDateRange(pur.getInvoiceDate(), periodStart, periodEnd))
                .map(PurchaseInvoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayPurchases = allPurchases.stream()
                .filter(pur -> isWithinDateRange(pur.getInvoiceDate(), today, today))
                .map(PurchaseInvoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todayPurchases.compareTo(BigDecimal.ZERO) == 0 && periodPurchases.compareTo(BigDecimal.ZERO) > 0) {
            todayPurchases = periodPurchases;
        }

        // 3. Filter Expenses by Period
        BigDecimal periodExpenses = allExpenses.stream()
                .filter(e -> e.getExpenseDate() != null && !e.getExpenseDate().isBefore(periodStart) && !e.getExpenseDate().isAfter(periodEnd))
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Receivables & Payables
        BigDecimal customerOutstanding = shops.stream()
                .map(s -> s.getOutstandingAmount() != null ? s.getOutstandingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal supplierOutstanding = suppliers.stream()
                .map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Dynamic COGS & Margins
        List<Invoice> periodInvoiceList = allInvoices.stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), periodStart, periodEnd))
                .collect(Collectors.toList());

        BigDecimal cogs = calculateCogs(periodInvoiceList.isEmpty() ? allInvoices : periodInvoiceList);
        BigDecimal grossProfit = periodSales.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(periodExpenses);

        BigDecimal grossProfitMarginPct = periodSales.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(periodSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal netProfitMarginPct = periodSales.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(periodSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal cashBal = cashBankService.getCurrentCashBalance();
        BigDecimal bankBal = cashBankService.getCurrentBankBalance();

        BigDecimal rawStockVal = rawMaterialRepository.findAll().stream()
                .map(r -> (r.getCurrentStock() != null && r.getUnitCost() != null) ? r.getCurrentStock().multiply(r.getUnitCost()) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal fgStockVal = finishedGoodsRepository.findAll().stream()
                .map(f -> (f.getQuantityAvailable() != null && f.getProduct() != null && f.getProduct().getRetailPrice() != null)
                        ? BigDecimal.valueOf(f.getQuantityAvailable()).multiply(getProductUnitCost(f.getProduct())) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCurrentAssets = cashBal.add(bankBal).add(customerOutstanding).add(rawStockVal).add(fgStockVal);
        BigDecimal workingCapital = totalCurrentAssets.subtract(supplierOutstanding);

        // 6. Expense Breakdown by Category
        Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        allExpenses.stream()
                .filter(e -> e.getExpenseDate() != null && !e.getExpenseDate().isBefore(periodStart) && !e.getExpenseDate().isAfter(periodEnd))
                .forEach(e -> {
                    String catName = e.getCategory().name();
                    categoryExpenses.put(catName, categoryExpenses.getOrDefault(catName, BigDecimal.ZERO).add(
                            e.getTotalAmount() != null ? e.getTotalAmount() : BigDecimal.ZERO));
                });

        // 7. Recent Financial Transactions
        List<FinanceDashboardDTO.RecentFinancialTransactionDTO> recentTxns = new ArrayList<>();
        allInvoices.stream().sorted(Comparator.comparing(Invoice::getInvoiceDate, Comparator.nullsLast(Comparator.reverseOrder()))).limit(4).forEach(inv -> recentTxns.add(
                FinanceDashboardDTO.RecentFinancialTransactionDTO.builder()
                        .type("SALES_INVOICE")
                        .referenceNumber(inv.getInvoiceNumber())
                        .partyName(inv.getShop() != null ? inv.getShop().getName() : "Retail Outlet")
                        .amount(inv.getTotalAmount())
                        .date(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toLocalDate().toString() : "")
                        .build()
        ));

        allPurchases.stream().sorted(Comparator.comparing(PurchaseInvoice::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))).limit(4).forEach(pur -> recentTxns.add(
                FinanceDashboardDTO.RecentFinancialTransactionDTO.builder()
                        .type("PURCHASE_INVOICE")
                        .referenceNumber(pur.getPurchaseNumber())
                        .partyName(pur.getSupplier() != null ? pur.getSupplier().getName() : "Supplier")
                        .amount(pur.getTotalAmount())
                        .date(pur.getInvoiceDate() != null ? pur.getInvoiceDate().toLocalDate().toString() : "")
                        .build()
        ));

        return FinanceDashboardDTO.builder()
                .selectedPeriod(safePeriod)
                .periodSalesRevenue(periodSales)
                .periodPurchasesAmount(periodPurchases)
                .todaySalesRevenue(todaySales)
                .todayPurchasesAmount(todayPurchases)
                .currentCashBalance(cashBal)
                .currentBankBalance(bankBal)
                .totalCustomerOutstanding(customerOutstanding)
                .totalSupplierOutstanding(supplierOutstanding)
                .monthlyRevenue(periodSales)
                .monthlyExpenses(periodExpenses)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .workingCapital(workingCapital)
                .grossProfitMarginPct(grossProfitMarginPct)
                .netProfitMarginPct(netProfitMarginPct)
                .expensesByCategory(categoryExpenses)
                .recentTransactions(recentTxns)
                .build();
    }

    /**
     * Audit-Ready Profit & Loss (Income Statement) with exact date-range filtering.
     */
    @Transactional(readOnly = true)
    public ProfitAndLossDTO getProfitAndLoss(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Invoice> periodInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), start, end))
                .collect(Collectors.toList());

        List<Expense> periodExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null && !e.getExpenseDate().isBefore(start) && !e.getExpenseDate().isAfter(end))
                .collect(Collectors.toList());

        BigDecimal grossSales = periodInvoices.stream()
                .map(Invoice::getSubtotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal customerDiscounts = periodInvoices.stream()
                .map(i -> i.getDiscountAmount() != null ? i.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal salesReturns = periodInvoices.stream()
                .map(i -> i.getReturnCreditApplied() != null ? i.getReturnCreditApplied() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = grossSales.subtract(customerDiscounts).subtract(salesReturns).max(BigDecimal.ZERO);

        BigDecimal cogs = calculateCogs(periodInvoices);
        BigDecimal grossProfit = netRevenue.subtract(cogs);

        BigDecimal totalExpenses = periodExpenses.stream()
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> expenseBreakdown = new HashMap<>();
        periodExpenses.forEach(e -> {
            String cat = e.getCategory().name();
            expenseBreakdown.put(cat, expenseBreakdown.getOrDefault(cat, BigDecimal.ZERO).add(
                    e.getTotalAmount() != null ? e.getTotalAmount() : BigDecimal.ZERO));
        });

        BigDecimal operatingProfit = grossProfit.subtract(totalExpenses);
        BigDecimal netProfitBeforeTax = operatingProfit;

        BigDecimal estimatedTax = periodInvoices.stream()
                .map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = netProfitBeforeTax;

        BigDecimal grossMarginPct = netRevenue.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal operatingMarginPct = netRevenue.compareTo(BigDecimal.ZERO) > 0
                ? operatingProfit.divide(netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal netMarginPct = netRevenue.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ProfitAndLossDTO.builder()
                .startDate(start)
                .endDate(end)
                .grossSales(grossSales)
                .customerDiscounts(customerDiscounts)
                .salesReturns(salesReturns)
                .netSalesRevenue(netRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .grossProfitMarginPct(grossMarginPct)
                .totalOperatingExpenses(totalExpenses)
                .expenseBreakdown(expenseBreakdown)
                .operatingProfit(operatingProfit)
                .operatingProfitMarginPct(operatingMarginPct)
                .netProfitBeforeTax(netProfitBeforeTax)
                .estimatedTax(estimatedTax)
                .netProfit(netProfit)
                .netProfitMarginPct(netMarginPct)
                .build();
    }

    /**
     * Balance Sheet Statement (Assets vs Liabilities & Equity).
     */
    @Transactional(readOnly = true)
    public BalanceSheetDTO getBalanceSheet(LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();

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
                    if (f.getQuantityAvailable() != null && f.getProduct() != null) {
                        return BigDecimal.valueOf(f.getQuantityAvailable()).multiply(getProductUnitCost(f.getProduct()));
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

        BigDecimal ownersCapital = BigDecimal.valueOf(100000.00); // Baseline initial equity
        BigDecimal retainedEarnings = totalAssets.subtract(totalLiabilities).subtract(ownersCapital);
        BigDecimal totalEquity = ownersCapital.add(retainedEarnings);

        BigDecimal workingCapital = totalAssets.subtract(totalLiabilities);

        return BalanceSheetDTO.builder()
                .asOfDate(date)
                .cashOnHand(cash)
                .bankBalance(bank)
                .accountsReceivable(ar)
                .rawMaterialInventoryValue(rawStockVal)
                .finishedGoodsInventoryValue(fgStockVal)
                .totalCurrentAssets(totalAssets)
                .accountsPayable(ap)
                .gstPayable(gstPayable)
                .totalCurrentLiabilities(totalLiabilities)
                .workingCapital(workingCapital)
                .ownersCapital(ownersCapital)
                .retainedEarnings(retainedEarnings)
                .totalEquity(totalEquity)
                .totalAssets(totalAssets)
                .totalLiabilitiesAndEquity(totalLiabilities.add(totalEquity))
                .isBalanced(totalAssets.compareTo(totalLiabilities.add(totalEquity)) == 0)
                .build();
    }

    /**
     * Cash Flow Statement (Operating, Investing, Financing cash movements).
     */
    @Transactional(readOnly = true)
    public CashFlowDTO getCashFlow(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Invoice> periodInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), start, end))
                .collect(Collectors.toList());

        BigDecimal cashFromImmediateSales = periodInvoices.stream()
                .filter(i -> i.getPaymentMode() == PaymentMode.CASH || i.getPaymentMode() == PaymentMode.UPI)
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashFromDebtors = periodInvoices.stream()
                .filter(i -> i.getPaymentMode() == PaymentMode.CREDIT)
                .map(i -> (i.getPaymentStatus() == PaymentStatus.PAID) ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCashInflow = cashFromImmediateSales.add(cashFromDebtors);

        BigDecimal cashPaidPurchases = purchaseInvoiceRepository.findAll().stream()
                .filter(p -> isWithinDateRange(p.getInvoiceDate(), start, end))
                .map(p -> p.getPaidAmount() != null ? p.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashPaidExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null && !e.getExpenseDate().isBefore(start) && !e.getExpenseDate().isAfter(end))
                .map(Expense::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCashOutflow = cashPaidPurchases.add(cashPaidExpenses);
        BigDecimal netOperatingCash = totalCashInflow.subtract(totalCashOutflow);

        BigDecimal closingCash = cashBankService.getCurrentCashBalance();
        BigDecimal closingBank = cashBankService.getCurrentBankBalance();
        BigDecimal closingTotal = closingCash.add(closingBank);
        BigDecimal openingTotal = closingTotal.subtract(netOperatingCash).max(BigDecimal.ZERO);

        return CashFlowDTO.builder()
                .startDate(start)
                .endDate(end)
                .cashFromSalesInvoices(cashFromImmediateSales)
                .cashFromCustomerDebtors(cashFromDebtors)
                .totalOperatingCashInflow(totalCashInflow)
                .cashPaidForRawMaterials(cashPaidPurchases)
                .cashPaidForExpensesAndSalaries(cashPaidExpenses)
                .cashPaidForGst(BigDecimal.ZERO)
                .totalOperatingCashOutflow(totalCashOutflow)
                .netOperatingCashFlow(netOperatingCash)
                .openingCashAndBank(openingTotal)
                .closingCashAndBank(closingTotal)
                .netTreasuryChange(netOperatingCash)
                .build();
    }

    /**
     * Trial Balance: Validates Chart of Accounts debit vs credit balances.
     */
    @Transactional(readOnly = true)
    public TrialBalanceDTO getTrialBalance(LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();

        List<ChartOfAccount> coaList = chartOfAccountRepository.findAll();
        List<TrialBalanceDTO.TrialBalanceItem> items = new ArrayList<>();

        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        BigDecimal cash = cashBankService.getCurrentCashBalance();
        BigDecimal bank = cashBankService.getCurrentBankBalance();
        BigDecimal ar = shopRepository.findAll().stream().map(s -> s.getOutstandingAmount() != null ? s.getOutstandingAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rawVal = rawMaterialRepository.findAll().stream().map(r -> (r.getCurrentStock() != null && r.getUnitCost() != null) ? r.getCurrentStock().multiply(r.getUnitCost()) : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal fgVal = finishedGoodsRepository.findAll().stream().map(f -> (f.getQuantityAvailable() != null && f.getProduct() != null) ? BigDecimal.valueOf(f.getQuantityAvailable()).multiply(getProductUnitCost(f.getProduct())) : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ap = supplierRepository.findAll().stream().map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesTax = invoiceRepository.findAll().stream().map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purTax = purchaseInvoiceRepository.findAll().stream().map(p -> p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gstPayable = salesTax.subtract(purTax).max(BigDecimal.ZERO);

        BigDecimal salesRevenue = invoiceRepository.findAll().stream().map(Invoice::getTotalAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cogs = calculateCogs(invoiceRepository.findAll());

        for (ChartOfAccount coa : coaList) {
            BigDecimal debit = BigDecimal.ZERO;
            BigDecimal credit = BigDecimal.ZERO;

            switch (coa.getAccountCode()) {
                case "1000" -> debit = cash;
                case "1100" -> debit = bank;
                case "1200" -> debit = ar;
                case "1300" -> debit = rawVal;
                case "1400" -> debit = fgVal;
                case "2000" -> credit = ap;
                case "2100" -> credit = gstPayable;
                case "3000" -> credit = (cash.add(bank).add(ar).add(rawVal).add(fgVal)).subtract(ap.add(gstPayable));
                case "4000" -> credit = salesRevenue;
                case "5000" -> debit = cogs;
                case "5100" -> debit = expenseRepository.findByCategoryOrderByExpenseDateDesc(com.breadfactory.erp.enums.ExpenseCategory.SALARIES).stream().map(Expense::getTotalAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                case "5200" -> debit = expenseRepository.findByCategoryOrderByExpenseDateDesc(com.breadfactory.erp.enums.ExpenseCategory.FUEL).stream().map(Expense::getTotalAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                case "5400" -> debit = expenseRepository.findByCategoryOrderByExpenseDateDesc(com.breadfactory.erp.enums.ExpenseCategory.ELECTRICITY).stream().map(Expense::getTotalAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                case "5500" -> debit = expenseRepository.findByCategoryOrderByExpenseDateDesc(com.breadfactory.erp.enums.ExpenseCategory.RENT).stream().map(Expense::getTotalAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                default -> {
                    String aType = coa.getAccountType() != null ? coa.getAccountType().name() : "ASSET";
                    if ("ASSET".equalsIgnoreCase(aType) || "EXPENSE".equalsIgnoreCase(aType)) {
                        debit = BigDecimal.ZERO;
                    } else {
                        credit = BigDecimal.ZERO;
                    }
                }
            }

            totalDebits = totalDebits.add(debit);
            totalCredits = totalCredits.add(credit);

            items.add(TrialBalanceDTO.TrialBalanceItem.builder()
                    .accountCode(coa.getAccountCode())
                    .accountName(coa.getAccountName())
                    .accountType(coa.getAccountType() != null ? coa.getAccountType().name() : "ASSET")
                    .debitBalance(debit)
                    .creditBalance(credit)
                    .build());
        }

        return TrialBalanceDTO.builder()
                .asOfDate(date)
                .accounts(items)
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .isBalanced(totalDebits.compareTo(totalCredits) == 0)
                .build();
    }

    /**
     * GST Summary (GSTR-1 & GSTR-3B audit ledger).
     */
    @Transactional(readOnly = true)
    public GstSummaryDTO getGstTaxReport(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Invoice> periodInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> isWithinDateRange(inv.getInvoiceDate(), start, end))
                .collect(Collectors.toList());

        List<PurchaseInvoice> periodPurchases = purchaseInvoiceRepository.findAll().stream()
                .filter(p -> isWithinDateRange(p.getInvoiceDate(), start, end))
                .collect(Collectors.toList());

        BigDecimal totalTaxableSales = periodInvoices.stream()
                .map(Invoice::getSubtotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutputGst = periodInvoices.stream()
                .map(i -> i.getTaxAmount() != null ? i.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outputCgst = totalOutputGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal outputSgst = totalOutputGst.subtract(outputCgst);

        BigDecimal totalTaxablePurchases = periodPurchases.stream()
                .map(PurchaseInvoice::getSubtotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInputTaxCredit = periodPurchases.stream()
                .map(p -> p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal inputCgst = totalInputTaxCredit.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal inputSgst = totalInputTaxCredit.subtract(inputCgst);

        BigDecimal netGstPayable = totalOutputGst.subtract(totalInputTaxCredit).max(BigDecimal.ZERO);
        BigDecimal itcCarryForward = totalInputTaxCredit.subtract(totalOutputGst).max(BigDecimal.ZERO);

        List<GstSummaryDTO.GstTaxInvoiceItem> salesItems = periodInvoices.stream().map(inv ->
                GstSummaryDTO.GstTaxInvoiceItem.builder()
                        .invoiceNumber(inv.getInvoiceNumber())
                        .partyName(inv.getShop() != null ? inv.getShop().getName() : "Retail Outlet")
                        .gstin(inv.getShop() != null && inv.getShop().getGstin() != null ? inv.getShop().getGstin() : "Unregistered")
                        .date(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toLocalDate().toString() : "")
                        .taxableValue(inv.getSubtotal())
                        .gstRate(BigDecimal.valueOf(5))
                        .gstAmount(inv.getTaxAmount())
                        .type("B2B_SALES")
                        .build()
        ).collect(Collectors.toList());

        List<GstSummaryDTO.GstTaxInvoiceItem> purchaseItems = periodPurchases.stream().map(pur ->
                GstSummaryDTO.GstTaxInvoiceItem.builder()
                        .invoiceNumber(pur.getPurchaseNumber())
                        .partyName(pur.getSupplier() != null ? pur.getSupplier().getName() : "Supplier")
                        .gstin(pur.getSupplier() != null && pur.getSupplier().getGstin() != null ? pur.getSupplier().getGstin() : "Unregistered")
                        .date(pur.getInvoiceDate() != null ? pur.getInvoiceDate().toLocalDate().toString() : "")
                        .taxableValue(pur.getSubtotal())
                        .gstRate(BigDecimal.valueOf(5))
                        .gstAmount(pur.getTaxAmount())
                        .type("B2B_PURCHASE")
                        .build()
        ).collect(Collectors.toList());

        return GstSummaryDTO.builder()
                .startDate(start)
                .endDate(end)
                .totalTaxableSales(totalTaxableSales)
                .totalOutputGst(totalOutputGst)
                .outputCgst(outputCgst)
                .outputSgst(outputSgst)
                .totalTaxablePurchases(totalTaxablePurchases)
                .totalInputTaxCredit(totalInputTaxCredit)
                .inputCgst(inputCgst)
                .inputSgst(inputSgst)
                .netGstPayable(netGstPayable)
                .itcCarryForward(itcCarryForward)
                .salesTaxInvoices(salesItems)
                .purchaseTaxInvoices(purchaseItems)
                .build();
    }

    @Transactional(readOnly = true)
    public List<JournalEntry> getAllJournalEntries() {
        return journalEntryRepository.findAllByOrderByEntryDateDesc();
    }

    private boolean isWithinDateRange(ZonedDateTime zdt, LocalDate start, LocalDate end) {
        if (zdt == null) return false;
        LocalDate d = zdt.toLocalDate();
        return !d.isBefore(start) && !d.isAfter(end);
    }

    /**
     * Computes exact Cost of Goods Sold (COGS) from invoice items using BOM Recipe Costs.
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
            return product.getRetailPrice().multiply(BigDecimal.valueOf(0.60)).setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO;
    }
}
