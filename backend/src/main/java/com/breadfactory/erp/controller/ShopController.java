package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Shop;
import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.entity.TripShopVisit;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.ShopRepository;
import com.breadfactory.erp.repository.TripRepository;
import com.breadfactory.erp.repository.UserRepository;
import com.breadfactory.erp.service.RouteOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/shops")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShopController {

    private final ShopRepository shopRepository;
    private final RouteOptimizationService routeOptimizationService;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Shop>> getShops(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long salesPersonId,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) String executiveCode,
            @RequestParam(required = false, defaultValue = "false") boolean all,
            Authentication authentication) {

        // 1. If explicitly requested 'all=true' (e.g. Admin Dashboard master shop directory), return all shops
        if (all) {
            return ResponseEntity.ok(shopRepository.findAll());
        }

        // 2. Resolve target user ID if passed or from authentication context
        Long targetUserId = salesPersonId != null ? salesPersonId : (driverId != null ? driverId : userId);
        if (targetUserId == null && authentication != null && authentication.getName() != null) {
            Optional<User> userOpt = userRepository.findByUsername(authentication.getName());
            if (userOpt.isPresent()) {
                targetUserId = userOpt.get().getId();
            }
        }

        // 3. If targetUserId is resolved, return ONLY shops from active dispatched trips for this user
        if (targetUserId != null) {
            List<Trip> activeTrips = tripRepository.findBySalesPersonIdAndStatus(targetUserId, TripStatus.DISPATCHED);
            activeTrips.addAll(tripRepository.findBySalesPersonIdAndStatus(targetUserId, TripStatus.IN_PROGRESS));
            activeTrips.addAll(tripRepository.findByDriverIdAndStatus(targetUserId, TripStatus.DISPATCHED));
            activeTrips.addAll(tripRepository.findByDriverIdAndStatus(targetUserId, TripStatus.IN_PROGRESS));

            if (activeTrips.isEmpty()) {
                // Return EMPTY list if no route has been dispatched to this sales person / driver!
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Extract shops associated with the active dispatched trips
            Set<Shop> dispatchedShops = new LinkedHashSet<>();
            for (Trip trip : activeTrips) {
                if (trip.getShopVisits() != null) {
                    for (TripShopVisit visit : trip.getShopVisits()) {
                        if (visit.getShop() != null) {
                            dispatchedShops.add(visit.getShop());
                        }
                    }
                }
            }
            return ResponseEntity.ok(new ArrayList<>(dispatchedShops));
        }

        // 4. If executiveCode filter is passed
        if (executiveCode != null && !executiveCode.isBlank()) {
            List<Trip> activeTrips = tripRepository.findActiveTrips();
            Set<Shop> dispatchedShops = new LinkedHashSet<>();
            for (Trip trip : activeTrips) {
                if (trip.getShopVisits() != null) {
                    for (TripShopVisit visit : trip.getShopVisits()) {
                        Shop s = visit.getShop();
                        if (s != null && (executiveCode.equalsIgnoreCase(s.getSalesExecutiveCode()) ||
                                (trip.getSalesPerson() != null && (executiveCode.equalsIgnoreCase(trip.getSalesPerson().getUsername()) || executiveCode.equalsIgnoreCase(trip.getSalesPerson().getFullName()))))) {
                            dispatchedShops.add(s);
                        }
                    }
                }
            }
            return ResponseEntity.ok(new ArrayList<>(dispatchedShops));
        }

        // 5. Default fallback: return empty list for unauthenticated / mobile requests without dispatch
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/map")
    public ResponseEntity<List<Map<String, Object>>> getShopsForMap() {
        List<Shop> shops = shopRepository.findAll();
        List<Map<String, Object>> mapData = shops.stream().map(s -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", s.getId());
            m.put("shopCode", s.getShopCode());
            m.put("name", s.getName());
            m.put("ownerName", s.getOwnerName());
            m.put("phone", s.getPhone());
            m.put("address", s.getAddress());
            m.put("areaName", s.getAreaName());
            m.put("routeName", s.getRouteName());
            m.put("customerType", s.getCustomerType());
            m.put("creditLimit", s.getCreditLimit());
            m.put("outstandingAmount", s.getOutstandingAmount());
            m.put("latitude", s.getLatitude());
            m.put("longitude", s.getLongitude());
            m.put("locationAccuracy", s.getLocationAccuracy());
            m.put("isActive", s.getIsActive());
            m.put("createdBy", s.getCreatedBy());
            m.put("salesExecutiveCode", s.getSalesExecutiveCode());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(mapData);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shop> getShopById(@PathVariable Long id) {
        return shopRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/executive/{executiveCode}")
    public ResponseEntity<List<Shop>> getShopsByExecutive(@PathVariable String executiveCode) {
        return ResponseEntity.ok(shopRepository.findBySalesExecutiveCode(executiveCode));
    }

    @PostMapping
    public ResponseEntity<Shop> createShop(@RequestBody Shop shop) {
        if (shop.getShopCode() == null || shop.getShopCode().isBlank()) {
            shop.setShopCode("SHP-" + System.currentTimeMillis() % 100000);
        }
        if (shop.getCreatedBy() == null || shop.getCreatedBy().isBlank()) {
            shop.setCreatedBy("Sales Executive");
        }
        if (shop.getSalesExecutiveCode() == null || shop.getSalesExecutiveCode().isBlank()) {
            shop.setSalesExecutiveCode("EXEC001");
        }
        if (shop.getLatitude() == null || shop.getLongitude() == null) {
            // Default to Factory Base if not supplied
            shop.setLatitude(BigDecimal.valueOf(10.787252191240228));
            shop.setLongitude(BigDecimal.valueOf(79.57505803846621));
        }
        return ResponseEntity.ok(shopRepository.save(shop));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shop> updateShop(@PathVariable Long id, @RequestBody Shop shopDetails) {
        return shopRepository.findById(id)
                .map(existing -> {
                    boolean coordinatesChanged = false;
                    if (shopDetails.getName() != null) existing.setName(shopDetails.getName());
                    if (shopDetails.getOwnerName() != null) existing.setOwnerName(shopDetails.getOwnerName());
                    if (shopDetails.getPhone() != null) existing.setPhone(shopDetails.getPhone());
                    if (shopDetails.getAddress() != null) existing.setAddress(shopDetails.getAddress());
                    if (shopDetails.getAreaName() != null) existing.setAreaName(shopDetails.getAreaName());
                    if (shopDetails.getRouteName() != null) existing.setRouteName(shopDetails.getRouteName());
                    if (shopDetails.getCustomerType() != null) existing.setCustomerType(shopDetails.getCustomerType());
                    if (shopDetails.getDiscountPercent() != null) existing.setDiscountPercent(shopDetails.getDiscountPercent());
                    if (shopDetails.getCreditLimit() != null) existing.setCreditLimit(shopDetails.getCreditLimit());
                    if (shopDetails.getOutstandingAmount() != null) existing.setOutstandingAmount(shopDetails.getOutstandingAmount());
                    if (shopDetails.getLocationAccuracy() != null) existing.setLocationAccuracy(shopDetails.getLocationAccuracy());
                    if (shopDetails.getIsActive() != null) existing.setIsActive(shopDetails.getIsActive());
                    if (shopDetails.getCreatedBy() != null) existing.setCreatedBy(shopDetails.getCreatedBy());
                    if (shopDetails.getSalesExecutiveCode() != null) existing.setSalesExecutiveCode(shopDetails.getSalesExecutiveCode());

                    if (shopDetails.getLatitude() != null && !Objects.equals(existing.getLatitude(), shopDetails.getLatitude())) {
                        existing.setLatitude(shopDetails.getLatitude());
                        coordinatesChanged = true;
                    }
                    if (shopDetails.getLongitude() != null && !Objects.equals(existing.getLongitude(), shopDetails.getLongitude())) {
                        existing.setLongitude(shopDetails.getLongitude());
                        coordinatesChanged = true;
                    }

                    Shop saved = shopRepository.save(existing);
                    if (coordinatesChanged) {
                        routeOptimizationService.markRoutesOutdatedForShop(saved.getId());
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShop(@PathVariable Long id) {
        if (shopRepository.existsById(id)) {
            shopRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
