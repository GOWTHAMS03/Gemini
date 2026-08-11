package com.breadfactory.erp.dto;

import lombok.*;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteGroupDTO {
    private Long id;
    private String routeName;
    private String description;
    private String areaRegion;
    private Boolean isActive;
    private List<ShopRouteDTO> shopRoutes;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
