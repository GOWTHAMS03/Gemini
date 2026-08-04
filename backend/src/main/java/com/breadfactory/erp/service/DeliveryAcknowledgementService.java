package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DeliveryAcknowledgementRequest;
import com.breadfactory.erp.entity.Delivery;
import com.breadfactory.erp.entity.DeliveryAcknowledgement;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.DeliveryStatus;
import com.breadfactory.erp.repository.DeliveryAcknowledgementRepository;
import com.breadfactory.erp.repository.DeliveryRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class DeliveryAcknowledgementService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryAcknowledgementRepository acknowledgementRepository;
    private final UserRepository userRepository;

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

        return acknowledgementRepository.save(ack);
    }
}
