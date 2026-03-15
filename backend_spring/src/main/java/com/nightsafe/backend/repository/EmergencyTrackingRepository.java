package com.nightsafe.backend.repository;

import com.nightsafe.backend.model.EmergencyTracking;
import com.nightsafe.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmergencyTrackingRepository extends JpaRepository<EmergencyTracking, Long> {
    List<EmergencyTracking> findByUserOrderByTimestampDesc(User user);
    List<EmergencyTracking> findByStatus(String status);
}
