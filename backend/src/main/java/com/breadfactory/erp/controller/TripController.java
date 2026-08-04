package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.TripCreateRequest;
import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.service.TripDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TripController {

    private final TripDispatchService tripDispatchService;

    @PostMapping("/dispatch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SALES_MANAGER', 'STORE_MANAGER')")
    public ResponseEntity<Trip> dispatchTrip(@Valid @RequestBody TripCreateRequest request) {
        return ResponseEntity.ok(tripDispatchService.createAndDispatchTrip(request));
    }
}
