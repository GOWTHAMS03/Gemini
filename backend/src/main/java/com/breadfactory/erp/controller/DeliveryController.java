package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Delivery;
import com.breadfactory.erp.entity.Shop;
import com.breadfactory.erp.entity.DeliveryAcknowledgement;
import com.breadfactory.erp.dto.DeliveryAcknowledgementRequest;
import com.breadfactory.erp.repository.DeliveryRepository;
import com.breadfactory.erp.service.DeliveryAcknowledgementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/deliveries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeliveryController {

    private final DeliveryAcknowledgementService acknowledgementService;
    private final DeliveryRepository deliveryRepository;

    @PostMapping("/acknowledge")
    public ResponseEntity<DeliveryAcknowledgement> acknowledgeDelivery(@Valid @RequestBody DeliveryAcknowledgementRequest request) {
        return ResponseEntity.ok(acknowledgementService.acknowledgeDelivery(request));
    }

    /**
     * Returns deliveries for a trip with fully resolved shop data.
     * Uses @Transactional to keep the Hibernate session open for lazy-loaded relations.
     */
    @GetMapping("/trip/{tripId}")
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> getDeliveriesByTrip(@PathVariable Long tripId) {
        List<Delivery> deliveries = deliveryRepository.findByTripId(tripId);

        List<Map<String, Object>> result = deliveries.stream().map(d -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", d.getId());
            map.put("deliveryNumber", d.getDeliveryNumber());
            map.put("status", d.getStatus().name());
            map.put("deliveryTime", d.getDeliveryTime());
            map.put("createdAt", d.getCreatedAt());

            // Eagerly resolve shop data into a nested map
            Shop shop = d.getShop();
            if (shop != null) {
                Map<String, Object> shopMap = new LinkedHashMap<>();
                shopMap.put("id", shop.getId());
                shopMap.put("shopCode", shop.getShopCode());
                shopMap.put("name", shop.getName());
                shopMap.put("ownerName", shop.getOwnerName());
                shopMap.put("phone", shop.getPhone());
                shopMap.put("address", shop.getAddress());
                shopMap.put("routeName", shop.getRouteName());
                shopMap.put("areaName", shop.getAreaName());
                shopMap.put("outstandingAmount", shop.getOutstandingAmount());
                shopMap.put("creditLimit", shop.getCreditLimit());
                shopMap.put("latitude", shop.getLatitude());
                shopMap.put("longitude", shop.getLongitude());
                shopMap.put("customerType", shop.getCustomerType());
                shopMap.put("createdBy", shop.getCreatedBy());
                shopMap.put("salesExecutiveCode", shop.getSalesExecutiveCode());
                shopMap.put("isActive", shop.getIsActive());
                map.put("shop", shopMap);
            }

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
