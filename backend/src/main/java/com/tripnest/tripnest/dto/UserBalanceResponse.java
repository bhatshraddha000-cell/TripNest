package com.tripnest.tripnest.dto;

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
public class UserBalanceResponse {
    private Double youOwe;
    private Double youShouldReceive;
    private Double netBalance;
}
