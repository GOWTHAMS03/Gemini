package com.breadfactory.erp.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name:diww3cwqd}") String cloudName,
            @Value("${cloudinary.api-key:182413739163318}") String apiKey,
            @Value("${cloudinary.api-secret:b6I9zFSccMcL-cMhpKAQ8_3_6wY}") String apiSecret
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        log.info("Initialized CloudinaryService with cloud_name: {}", cloudName);
    }

    public Map uploadImage(MultipartFile file, String folder) throws IOException {
        String targetFolder = (folder != null && !folder.trim().isEmpty()) ? folder : "bread_erp/products";
        Map uploadParams = ObjectUtils.asMap(
                "folder", targetFolder,
                "resource_type", "image"
        );
        return cloudinary.uploader().upload(file.getBytes(), uploadParams);
    }

    public String uploadImageAndGetUrl(MultipartFile file, String folder) throws IOException {
        Map result = uploadImage(file, folder);
        if (result != null && result.containsKey("secure_url")) {
            return (String) result.get("secure_url");
        } else if (result != null && result.containsKey("url")) {
            return (String) result.get("url");
        }
        throw new IOException("Failed to obtain secure URL from Cloudinary upload response");
    }
}
