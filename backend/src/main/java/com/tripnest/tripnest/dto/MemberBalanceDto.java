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
public class MemberBalanceDto {
    private Long userId;
    private String name;
    private String email;
    private String profileImage;
    private Double youShouldReceive;
    private Double youOwe;
    private Double netBalance;
}
