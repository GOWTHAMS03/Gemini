package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.DispatchGroupCreateRequest;
import com.breadfactory.erp.dto.DispatchGroupDTO;
import com.breadfactory.erp.service.TripDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dispatch-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DispatchGroupController {

    private final TripDispatchService tripDispatchService;

    @PostMapping
    public ResponseEntity<DispatchGroupDTO> createDispatchGroup(
            @Valid @RequestBody DispatchGroupCreateRequest request,
            Authentication authentication) {
        String username = (authentication != null && authentication.getName() != null) ? authentication.getName() : "ADMIN";
        DispatchGroupDTO result = tripDispatchService.createDispatchGroup(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<DispatchGroupDTO>> getActiveDispatchGroups() {
        List<DispatchGroupDTO> result = tripDispatchService.getActiveDispatchGroups();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DispatchGroupDTO> getDispatchGroup(@PathVariable Long id) {
        DispatchGroupDTO result = tripDispatchService.getDispatchGroup(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<com.breadfactory.erp.dto.TripSettlementDTO.DispatchGroupDetailResponse> getDispatchGroupDetails(@PathVariable Long id) {
        return ResponseEntity.ok(tripDispatchService.getDispatchGroupDetails(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DispatchGroupDTO> updateDispatchGroup(
            @PathVariable Long id,
            @RequestBody DispatchGroupCreateRequest request) {
        DispatchGroupDTO result = tripDispatchService.updateDispatchGroup(id, request);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDispatchGroup(@PathVariable Long id) {
        tripDispatchService.deleteDispatchGroup(id);
        return ResponseEntity.noContent().build();
    }
}
