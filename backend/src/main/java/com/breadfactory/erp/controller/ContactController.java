package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.ContactInquiry;
import com.breadfactory.erp.repository.ContactInquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactInquiryRepository contactInquiryRepository;

    @PostMapping
    public ResponseEntity<?> submitContactInquiry(@RequestBody Map<String, Object> payload) {
        String fullName = payload.get("fullName") != null ? payload.get("fullName").toString().trim() : null;
        String email = payload.get("email") != null ? payload.get("email").toString().trim() : null;
        String phone = payload.get("phone") != null ? payload.get("phone").toString().trim() : null;
        String companyName = payload.get("companyName") != null ? payload.get("companyName").toString().trim() : null;
        String subject = payload.get("subject") != null ? payload.get("subject").toString().trim() : null;
        String message = payload.get("message") != null ? payload.get("message").toString().trim() : null;
        String inquiryType = payload.get("inquiryType") != null ? payload.get("inquiryType").toString().trim() : "GENERAL";

        Map<String, String> errors = new HashMap<>();

        if (fullName == null || fullName.length() < 2) {
            errors.put("fullName", "Full name must be at least 2 characters");
        }
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            errors.put("email", "Please provide a valid email address");
        }
        if (subject == null || subject.length() < 3) {
            errors.put("subject", "Subject must be at least 3 characters");
        }
        if (message == null || message.length() < 10) {
            errors.put("message", "Message must be at least 10 characters");
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Validation failed",
                    "errors", errors
            ));
        }

        ContactInquiry inquiry = ContactInquiry.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .companyName(companyName)
                .subject(subject)
                .message(message)
                .inquiryType(inquiryType)
                .status("NEW")
                .build();

        ContactInquiry saved = contactInquiryRepository.save(inquiry);
        log.info("New contact inquiry received: #{} from {} ({})", saved.getId(), saved.getFullName(), saved.getEmail());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thank you for contacting Gemino Foods Industry. Our team will get back to you shortly.",
                "referenceNumber", "GEM-INQ-" + saved.getId(),
                "inquiry", saved
        ));
    }

    @GetMapping
    public ResponseEntity<List<ContactInquiry>> getAllInquiries() {
        return ResponseEntity.ok(contactInquiryRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInquiryById(@PathVariable Long id) {
        return contactInquiryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
