package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.ActivityLogResponse;
import com.tripnest.tripnest.model.ActivityLog;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private static final int MAX_LOGS_PER_USER = 10;

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(User user, String entityType, Long entityId, String action, String title, String description) {
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .title(title)
                .description(description)
                .build();
        activityLogRepository.save(log);

        // Auto-cleanup: keep only the most recent MAX_LOGS_PER_USER logs per user
        while (activityLogRepository.countByUser(user) > MAX_LOGS_PER_USER) {
            activityLogRepository.findTopByUserOrderByCreatedAtAsc(user)
                    .ifPresent(activityLogRepository::delete);
        }
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getDashboardActivities(User user) {
        List<ActivityLog> logs = activityLogRepository.findTop5ByUserOrderByCreatedAtDesc(user);
        return mapToResponseList(logs);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getActivityHistory(User user) {
        List<ActivityLog> logs = activityLogRepository.findTop10ByUserOrderByCreatedAtDesc(user);
        return mapToResponseList(logs);
    }

    private List<ActivityLogResponse> mapToResponseList(List<ActivityLog> logs) {
        return logs.stream()
                .map(log -> ActivityLogResponse.builder()
                        .id(log.getId())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .action(log.getAction())
                        .title(log.getTitle())
                        .description(log.getDescription())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();
    }
}
