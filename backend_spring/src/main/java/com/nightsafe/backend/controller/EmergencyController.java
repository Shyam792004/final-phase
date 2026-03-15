package com.nightsafe.backend.controller;

import com.nightsafe.backend.model.EmergencyTracking;
import com.nightsafe.backend.model.User;
import com.nightsafe.backend.repository.EmergencyTrackingRepository;
import com.nightsafe.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class EmergencyController {

    @Autowired
    private EmergencyTrackingRepository trackingRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/sync")
    public ResponseEntity<?> syncLocation(@RequestParam String username, @RequestBody EmergencyTracking tracking) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        tracking.setUser(user);
        tracking.setTimestamp(LocalDateTime.now());
        trackingRepository.save(tracking);

        return ResponseEntity.ok("Location synced");
    }

    @GetMapping("/history/{username}")
    public ResponseEntity<?> getHistory(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        List<EmergencyTracking> history = trackingRepository.findByUserOrderByTimestampDesc(user);
        return ResponseEntity.ok(history);
    }
}
