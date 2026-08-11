package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteGroupCreateRequest {

    @NotBlank(message = "Route name is required")
    private String routeName;

    private String description;

    private String areaRegion;

    @Builder.Default
    private Boolean isActive = true;
}
