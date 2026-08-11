package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.RouteGroupCreateRequest;
import com.breadfactory.erp.dto.RouteGroupDTO;
import com.breadfactory.erp.dto.ShopRouteCreateRequest;
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
@RequestMapping("/route-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RouteGroupController {

    private final TripDispatchService tripDispatchService;

    @PostMapping
    public ResponseEntity<RouteGroupDTO> createRouteGroup(
            @Valid @RequestBody RouteGroupCreateRequest request,
            Authentication authentication) {
        String username = (authentication != null && authentication.getName() != null) ? authentication.getName() : "ADMIN";
        RouteGroupDTO result = tripDispatchService.createRouteGroup(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<RouteGroupDTO>> getActiveRoutes() {
        List<RouteGroupDTO> result = tripDispatchService.getActiveRoutes();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{routeGroupId}/shops")
    public ResponseEntity<RouteGroupDTO> addShopToRoute(
            @PathVariable Long routeGroupId,
            @Valid @RequestBody ShopRouteCreateRequest request,
            Authentication authentication) {
        String username = (authentication != null && authentication.getName() != null) ? authentication.getName() : "ADMIN";
        RouteGroupDTO result = tripDispatchService.addShopToRoute(routeGroupId, request, username);
        return ResponseEntity.ok(result);
    }
}
