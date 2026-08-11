package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.DispatchGroupStatus;
import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchGroupDTO {
    private Long id;
    private String groupName;
    private String description;
    private Long salesPersonId;
    private String salesPersonName;
    private Long driverId;
    private String driverName;
    private Long vehicleId;
    private String vehicleNumber;
    private DispatchGroupStatus status;
    private Boolean isActive;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
