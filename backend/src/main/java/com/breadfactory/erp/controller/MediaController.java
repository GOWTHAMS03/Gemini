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
import java.util.List;
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
            @RequestParam(value = "folder", required = false, defaultValue = CloudinaryService.FOLDER_PRODUCTS) String folder
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
        return uploadImage(file, CloudinaryService.FOLDER_PRODUCTS);
    }

    @PostMapping(value = "/pod/upload-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPodProofImage(
            @RequestParam("file") MultipartFile file
    ) {
        return uploadImage(file, CloudinaryService.FOLDER_POD);
    }

    /**
     * Upload Driving License (DL) document directly to Cloudinary 'bread_erp/drivers/dl' folder.
     */
    @PostMapping(value = "/drivers/upload-dl", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDriverDl(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "driverName", required = false) String driverName
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid Driving License file"));
        }

        try {
            Map uploadResult = cloudinaryService.uploadDriverDl(file, driverName);
            Map<String, Object> response = new HashMap<>();
            response.put("secure_url", uploadResult.get("secure_url"));
            response.put("url", uploadResult.get("url"));
            response.put("public_id", uploadResult.get("public_id"));
            response.put("format", uploadResult.get("format"));
            response.put("bytes", uploadResult.get("bytes"));
            response.put("folder", CloudinaryService.FOLDER_DRIVER_DL);
            response.put("original_filename", file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Cloudinary Driver DL upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Driver DL upload to Cloudinary failed: " + e.getMessage()));
        }
    }

    /**
     * Retrieve all Driving License (DL) documents stored in Cloudinary 'bread_erp/drivers/dl' folder.
     */
    @GetMapping("/drivers/dl-documents")
    public ResponseEntity<?> getDriverDlDocuments() {
        List<Map<String, Object>> documents = cloudinaryService.listDlDocuments();
        return ResponseEntity.ok(Map.of(
                "folder", CloudinaryService.FOLDER_DRIVER_DL,
                "count", documents.size(),
                "documents", documents
        ));
    }
}
