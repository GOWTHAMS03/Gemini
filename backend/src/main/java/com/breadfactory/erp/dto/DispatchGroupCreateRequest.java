package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.DispatchGroupStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchGroupCreateRequest {

    @NotBlank(message = "Group name is required")
    private String groupName;

    private String description;

    private Long salesPersonId;

    private Long driverId;

    private Long vehicleId;

    @Builder.Default
    private DispatchGroupStatus status = DispatchGroupStatus.ACTIVE;
}
