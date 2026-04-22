package com.postmanchat.repo;

import com.postmanchat.domain.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    boolean existsBySubmitterIdAndTargetId(UUID submitterId, UUID targetId);
}
