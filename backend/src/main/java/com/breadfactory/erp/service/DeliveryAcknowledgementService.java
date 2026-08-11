package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DeliveryAcknowledgementRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.DeliveryStatus;
import com.breadfactory.erp.enums.ShopVisitStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryAcknowledgementService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAcknowledgementRepository acknowledgementRepository;
    private final UserRepository userRepository;
    private final TripShopVisitRepository tripShopVisitRepository;
    private final TripRepository tripRepository;

    @Transactional
    public DeliveryAcknowledgement acknowledgeDelivery(DeliveryAcknowledgementRequest request) {
        Delivery delivery = deliveryRepository.findById(request.getDeliveryId())
                .orElseThrow(() -> new RuntimeException("Delivery record not found"));

        User shopUser = null;
        if (request.getVerifiedByShopUserId() != null) {
            shopUser = userRepository.findById(request.getVerifiedByShopUserId()).orElse(null);
        }

        DeliveryAcknowledgement ack = DeliveryAcknowledgement.builder()
                .delivery(delivery)
                .acceptedQuantity(request.getAcceptedQuantity())
                .damagedQuantity(request.getDamagedQuantity() != null ? request.getDamagedQuantity() : 0)
                .missingQuantity(request.getMissingQuantity() != null ? request.getMissingQuantity() : 0)
                .digitalSignatureUrl(request.getDigitalSignatureUrl())
                .photoProofUrl(request.getPhotoProofUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .verifiedByShopUser(shopUser)
                .acknowledgedAt(ZonedDateTime.now())
                .build();

        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveryTime(ZonedDateTime.now());
        deliveryRepository.save(delivery);

        // Real-Time Sync with Trip & TripShopVisit entities for live Admin Dashboard progress
        if (delivery.getTrip() != null) {
            Trip trip = delivery.getTrip();
            Long shopId = delivery.getShop() != null ? delivery.getShop().getId() : null;
            if (shopId != null) {
                List<TripShopVisit> visits = tripShopVisitRepository.findByTripIdOrderByVisitSequence(trip.getId());
                for (TripShopVisit visit : visits) {
                    if (visit.getShop() != null && visit.getShop().getId().equals(shopId)) {
                        visit.setStatus(ShopVisitStatus.COMPLETED);
                        visit.setPhotoProofUrl(request.getPhotoProofUrl());
                        visit.setDigitalSignatureUrl(request.getDigitalSignatureUrl());
                        visit.setActualArrivalTime(ZonedDateTime.now());
                        visit.setActualDepartureTime(ZonedDateTime.now());
                        tripShopVisitRepository.save(visit);
                    }
                }

                // Auto complete trip when all shops are delivered
                boolean allVisitsCompleted = visits.stream()
                        .allMatch(v -> v.getStatus() == ShopVisitStatus.COMPLETED || v.getStatus() == ShopVisitStatus.CANCELLED);
                if (allVisitsCompleted) {
                    trip.setStatus(com.breadfactory.erp.enums.TripStatus.COMPLETED);
                    trip.setCompletionTime(ZonedDateTime.now());
                    tripRepository.save(trip);
                }
            }
        }

        return acknowledgementRepository.save(ack);
    }
}
