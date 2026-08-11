package com.breadfactory.erp.controller;

import com.breadfactory.erp.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MediaController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "bread_erp/products") String folder
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid image file"));
        }

        try {
            Map uploadResult = cloudinaryService.uploadImage(file, folder);
            Map<String, Object> response = new HashMap<>();
            response.put("secure_url", uploadResult.get("secure_url"));
            response.put("url", uploadResult.get("url"));
            response.put("public_id", uploadResult.get("public_id"));
            response.put("format", uploadResult.get("format"));
            response.put("bytes", uploadResult.get("bytes"));
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Image upload failed: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/products/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProductImage(
            @RequestParam("file") MultipartFile file
    ) {
        return uploadImage(file, "bread_erp/products");
    }

    @PostMapping(value = "/pod/upload-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPodProofImage(
            @RequestParam("file") MultipartFile file
    ) {
        return uploadImage(file, "bread_erp/pod");
    }
}
