package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ShopVisitStatus;
import lombok.*;

import java.time.LocalTime;
import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripShopVisitDTO {
    private Long id;
    private Long shopId;
    private String shopCode;
    private String shopName;
    private String shopAddress;
    private String shopOwnerName;
    private String shopPhone;
    
    private Integer visitSequence;
    private ShopVisitStatus status;
    
    private LocalTime expectedVisitTime;
    private ZonedDateTime actualArrivalTime;
    private ZonedDateTime actualDepartureTime;
    
    private String notes;
    private String photoProofUrl;
    private String digitalSignatureUrl;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
