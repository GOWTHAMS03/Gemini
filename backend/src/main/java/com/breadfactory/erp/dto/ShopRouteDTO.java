package com.breadfactory.erp.dto;

import lombok.*;

import java.time.LocalTime;
import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopRouteDTO {
    private Long id;
    private Long shopId;
    private String shopCode;
    private String shopName;
    private String shopAddress;
    private Integer visitDay;
    private String visitDayName;  // Monday, Tuesday, etc.
    private Integer visitSequence;
    private LocalTime expectedVisitTime;
    private Boolean isActive;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
