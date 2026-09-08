package kr.coders.ansimlife.application;

import java.time.LocalDateTime;

public record ExternalApplicationReceipt(
        String receiptNumber,
        String externalApplicationId,
        String agencyName,
        LocalDateTime submittedAt) {
}
