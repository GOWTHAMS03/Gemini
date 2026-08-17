package com.breadfactory.erp.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public static final String FOLDER_PRODUCTS = "bread_erp/products";
    public static final String FOLDER_POD = "bread_erp/pod";
    public static final String FOLDER_DRIVER_DL = "bread_erp/drivers/dl";

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

    /**
     * Upload an image or general file to Cloudinary under the specified folder.
     */
    public Map uploadImage(MultipartFile file, String folder) throws IOException {
        String targetFolder = (folder != null && !folder.trim().isEmpty()) ? folder : FOLDER_PRODUCTS;
        Map uploadParams = ObjectUtils.asMap(
                "folder", targetFolder,
                "resource_type", "auto"
        );
        return cloudinary.uploader().upload(file.getBytes(), uploadParams);
    }

    /**
     * Dedicated Driver DL (Driving License) upload to bread_erp/drivers/dl folder.
     */
    public Map uploadDriverDl(MultipartFile file, String driverName) throws IOException {
        String baseName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "dl_document";
        // Clean filename and tag
        String sanitizedName = (driverName != null && !driverName.trim().isEmpty()) 
                ? "dl_" + driverName.trim().replaceAll("[^a-zA-Z0-9_-]", "_") + "_" + System.currentTimeMillis()
                : "dl_" + System.currentTimeMillis();

        Map uploadParams = ObjectUtils.asMap(
                "folder", FOLDER_DRIVER_DL,
                "public_id", sanitizedName,
                "resource_type", "auto",
                "tags", "driver_dl,onboarding,bread_erp"
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

    /**
     * List all DL documents stored in the Cloudinary 'bread_erp/drivers/dl' folder.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listDlDocuments() {
        List<Map<String, Object>> dlFiles = new ArrayList<>();
        try {
            // First attempt: Cloudinary Admin API by folder prefix
            Map result = cloudinary.api().resources(ObjectUtils.asMap(
                    "type", "upload",
                    "prefix", FOLDER_DRIVER_DL,
                    "max_results", 50
            ));

            if (result != null && result.containsKey("resources")) {
                List<Map> resources = (List<Map>) result.get("resources");
                for (Map res : resources) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("public_id", res.get("public_id"));
                    item.put("secure_url", res.get("secure_url"));
                    item.put("url", res.get("url"));
                    item.put("format", res.get("format"));
                    item.put("created_at", res.get("created_at"));
                    item.put("bytes", res.get("bytes"));
                    item.put("folder", FOLDER_DRIVER_DL);
                    
                    String publicId = (String) res.get("public_id");
                    String displayName = publicId != null && publicId.contains("/") 
                            ? publicId.substring(publicId.lastIndexOf('/') + 1) 
                            : publicId;
                    item.put("name", displayName);
                    dlFiles.add(item);
                }
            }
        } catch (Exception e) {
            log.warn("Cloudinary list resources by prefix failed, trying Search API: {}", e.getMessage());
            try {
                // Second attempt: Cloudinary Search API
                Map searchResult = cloudinary.search()
                        .expression("folder:" + FOLDER_DRIVER_DL)
                        .sortBy("created_at", "desc")
                        .maxResults(50)
                        .execute();

                if (searchResult != null && searchResult.containsKey("resources")) {
                    List<Map> resources = (List<Map>) searchResult.get("resources");
                    for (Map res : resources) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("public_id", res.get("public_id"));
                        item.put("secure_url", res.get("secure_url"));
                        item.put("url", res.get("url"));
                        item.put("format", res.get("format"));
                        item.put("created_at", res.get("created_at"));
                        item.put("bytes", res.get("bytes"));
                        item.put("folder", FOLDER_DRIVER_DL);

                        String publicId = (String) res.get("public_id");
                        String displayName = publicId != null && publicId.contains("/") 
                                ? publicId.substring(publicId.lastIndexOf('/') + 1) 
                                : publicId;
                        item.put("name", displayName);
                        dlFiles.add(item);
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to retrieve DL documents from Cloudinary: {}", ex.getMessage());
            }
        }
        return dlFiles;
    }
}
