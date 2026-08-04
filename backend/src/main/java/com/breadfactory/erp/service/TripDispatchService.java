package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.TripCreateRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripDispatchService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Trip createAndDispatchTrip(TripCreateRequest request) {
        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        String tripNumber = "TRIP-" + System.currentTimeMillis();

        Trip trip = Trip.builder()
                .tripNumber(tripNumber)
                .driver(driver)
                .vehicle(vehicle)
                .routeName(request.getRouteName())
                .status(TripStatus.DISPATCHED)
                .dispatchTime(ZonedDateTime.now())
                .items(new ArrayList<>())
                .build();

        if (request.getItems() != null) {
            for (TripCreateRequest.TripItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                TripItem item = TripItem.builder()
                        .trip(trip)
                        .product(product)
                        .loadedQuantity(itemReq.getLoadedQuantity())
                        .soldQuantity(0)
                        .returnedQuantity(0)
                        .damagedQuantity(0)
                        .build();

                trip.getItems().add(item);
            }
        }

        return tripRepository.save(trip);
    }
}
