package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;

import com.tripnest.tripnest.model.PaymentStatus;

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
public class ExpenseSplitResponse {
    private Long id;
    private Long expenseId;
    private Long userId;
    private String name;
    private String email;
    private String profileImage;
    private Double shareAmount;
    private PaymentStatus paymentStatus;
    private LocalDateTime paidAt;
}
