package com.postmanchat.service;

import com.postmanchat.domain.Report;
import com.postmanchat.repo.ReportRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.CreateReportRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
public class ReportService {

    private static final Set<String> VALID_TARGET_TYPES = Set.of("message", "user");
    private static final Set<String> VALID_REASONS = Set.of("spam", "harassment", "inappropriate_content", "impersonation", "other");

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Transactional
    public void submitReport(CreateReportRequest request) {
        UUID submitterId = Authz.requireUserId();
        if (!VALID_TARGET_TYPES.contains(request.targetType())) {
            throw new IllegalArgumentException("Invalid target type");
        }
        if (!VALID_REASONS.contains(request.reason())) {
            throw new IllegalArgumentException("Invalid reason");
        }
        if (submitterId.equals(request.targetId())) {
            throw new IllegalArgumentException("Cannot report yourself");
        }
        if (reportRepository.existsBySubmitterIdAndTargetId(submitterId, request.targetId())) {
            return;
        }
        String notes = request.notes() == null ? null : request.notes().trim();
        reportRepository.save(new Report(UUID.randomUUID(), submitterId, request.targetType(), request.targetId(), request.reason(), notes));
    }
}
