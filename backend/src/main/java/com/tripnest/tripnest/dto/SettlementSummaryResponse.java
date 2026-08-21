package com.tripnest.tripnest.dto;

import java.util.List;

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
public class SettlementSummaryResponse {
    private Double totalExpenses;
    private Double totalPending;
    private Double totalSettled;
    private List<MemberBalanceDto> members;
    private List<PendingSettlementDto> pendingSettlements;
    private List<PendingSettlementDto> completedSettlements;
}
