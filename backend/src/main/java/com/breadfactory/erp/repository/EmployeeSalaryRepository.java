package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.EmployeeSalary;
import com.breadfactory.erp.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, Long> {

    List<EmployeeSalary> findBySalaryMonthOrderByEmployeeFullNameAsc(String salaryMonth);

    List<EmployeeSalary> findBySalaryMonthAndStatus(String salaryMonth, PaymentStatus status);

    Optional<EmployeeSalary> findByEmployeeIdAndSalaryMonth(Long employeeId, String salaryMonth);

    List<EmployeeSalary> findByEmployeeIdOrderBySalaryMonthDesc(Long employeeId);

    boolean existsByEmployeeIdAndSalaryMonth(Long employeeId, String salaryMonth);

    @Query("SELECT SUM(s.netSalary) FROM EmployeeSalary s WHERE s.salaryMonth = :salaryMonth")
    BigDecimal sumNetSalaryByMonth(@Param("salaryMonth") String salaryMonth);

    @Query("SELECT SUM(s.netSalary) FROM EmployeeSalary s WHERE s.salaryMonth = :salaryMonth AND s.status = 'PAID'")
    BigDecimal sumPaidSalaryByMonth(@Param("salaryMonth") String salaryMonth);

    @Query("SELECT SUM(s.netSalary) FROM EmployeeSalary s WHERE s.salaryMonth = :salaryMonth AND s.status != 'PAID'")
    BigDecimal sumPendingSalaryByMonth(@Param("salaryMonth") String salaryMonth);

    @Query("SELECT SUM(s.netSalary) FROM EmployeeSalary s WHERE s.employee.id = :employeeId AND s.status = 'PAID'")
    BigDecimal sumPaidSalaryByEmployee(@Param("employeeId") Long employeeId);

    @Query("SELECT SUM(s.netSalary) FROM EmployeeSalary s WHERE s.employee.id = :employeeId AND s.status != 'PAID'")
    BigDecimal sumPendingSalaryByEmployee(@Param("employeeId") Long employeeId);
}
