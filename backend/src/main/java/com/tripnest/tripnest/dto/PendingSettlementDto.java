package com.tripnest.tripnest.dto;

import java.time.LocalDate;
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
public class PendingSettlementDto {
    private Long splitId;
    private Long expenseId;
    private String expenseTitle;
    private Long payerId;
    private String payerName;
    private Long receiverId;
    private String receiverName;
    private Double amount;
    private LocalDate date;
    private PaymentStatus paymentStatus;
    private LocalDateTime paidAt;
}
