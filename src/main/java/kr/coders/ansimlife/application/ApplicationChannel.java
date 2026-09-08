package kr.coders.ansimlife.application;

public record ApplicationChannel(
        String mode,
        String label,
        String description,
        boolean directAvailable,
        String officialUrl) {
}
