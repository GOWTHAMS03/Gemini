package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Expense;
import com.breadfactory.erp.enums.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategoryOrderByExpenseDateDesc(ExpenseCategory category);
    List<Expense> findAllByOrderByExpenseDateDesc();
}
