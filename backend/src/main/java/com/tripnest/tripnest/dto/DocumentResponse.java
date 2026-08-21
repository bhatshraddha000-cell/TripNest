package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {
    private Long id;
    private Long tripId;
    private UserProfileResponse uploadedBy;
    private String fileName;
    private String fileUrl;
    private String documentType;
    private LocalDateTime uploadedAt;
}
