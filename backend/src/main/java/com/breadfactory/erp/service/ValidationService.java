package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.entity.Vehicle;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.TripRepository;
import com.breadfactory.erp.repository.UserRepository;
import com.breadfactory.erp.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for validating business rules in trip dispatch system.
 */
@Service
@RequiredArgsConstructor
public class ValidationService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Validate that a user exists and is active
     */
    public void validateActiveUser(Long userId, String userType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(userType + " not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException(userType + " is not active and cannot be assigned to a trip");
        }
    }

    /**
     * Validate that a vehicle exists and is active
     */
    public void validateActiveVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getIsActive()) {
            throw new RuntimeException("Vehicle is not active and cannot be assigned to a trip");
        }
    }

    /**
     * Check that a user doesn't have any active trips
     */
    public void validateNoActiveTrip(Long userId, String userType) {
        boolean hasActiveTrip = tripRepository.hasActiveTrip(userId);
        if (hasActiveTrip) {
            throw new RuntimeException(userType + " already has an active trip and cannot be assigned to another trip");
        }
    }

    /**
     * Check that a vehicle doesn't have any active trips
     */
    public void validateNoActiveVehicleTrip(Long vehicleId) {
        boolean hasActiveTrip = tripRepository.hasActiveVehicleTrip(vehicleId);
        if (hasActiveTrip) {
            throw new RuntimeException("Vehicle already has an active trip and cannot be assigned to another trip");
        }
    }

    /**
     * Check that a sales person doesn't have any active trips
     */
    public void validateSalesPersonNoActiveTrip(Long salesPersonId) {
        boolean hasActiveTrip = tripRepository.hasSalesPersonActiveTrip(salesPersonId);
        if (hasActiveTrip) {
            throw new RuntimeException("Sales person already has an active trip");
        }
    }
}
