package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.DashboardAnalyticsDTO;
import com.breadfactory.erp.dto.DashboardKpiDTO;
import com.breadfactory.erp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiDTO> getKpis() {
        return ResponseEntity.ok(dashboardService.getDashboardKpis());
    }

    @GetMapping("/analytics")
    public ResponseEntity<DashboardAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(dashboardService.getDashboardAnalytics());
    }
}
