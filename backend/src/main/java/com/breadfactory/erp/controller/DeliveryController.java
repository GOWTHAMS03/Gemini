package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.DeliveryAcknowledgementRequest;
import com.breadfactory.erp.entity.DeliveryAcknowledgement;
import com.breadfactory.erp.service.DeliveryAcknowledgementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/deliveries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeliveryController {

    private final DeliveryAcknowledgementService acknowledgementService;

    @PostMapping("/acknowledge")
    public ResponseEntity<DeliveryAcknowledgement> acknowledgeDelivery(@Valid @RequestBody DeliveryAcknowledgementRequest request) {
        return ResponseEntity.ok(acknowledgementService.acknowledgeDelivery(request));
    }
}
