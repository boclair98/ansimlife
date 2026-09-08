package kr.coders.ansimlife.application;

import kr.coders.ansimlife.support.SupportProgram;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ApplicationConnectorRegistry {

    private final List<BenefitApplicationConnector> connectors;

    public ApplicationConnectorRegistry(List<BenefitApplicationConnector> connectors) {
        this.connectors = List.copyOf(connectors);
    }

    public Optional<BenefitApplicationConnector> connectorFor(SupportProgram program) {
        return connectors.stream().filter(connector -> connector.supports(program)).findFirst();
    }

    public ApplicationChannel describe(SupportProgram program) {
        Optional<BenefitApplicationConnector> connector = connectorFor(program);
        if (connector.isPresent()) {
            return new ApplicationChannel(
                    "DIRECT",
                    "안심생활에서 바로 신청",
                    "제출 후 접수기관이 발급한 접수번호를 확인할 수 있어요.",
                    true,
                    program.getApplyUrl());
        }

        String deadline = safe(program.getDeadline());
        if (deadline.contains("별도의 신청절차가 없음") || deadline.contains("신청절차 없음")) {
            return new ApplicationChannel(
                    "NO_APPLICATION",
                    "별도 신청 없음",
                    "자동 제공 여부와 이용 조건을 상세 안내에서 확인해주세요.",
                    false,
                    program.getApplyUrl());
        }

        if (program.getApplyUrl() != null && !program.getApplyUrl().isBlank()) {
            return new ApplicationChannel(
                    "OFFICIAL_SITE",
                    "공식 접수처 확인 필요",
                    "신청서는 여기서 준비하고, 현재는 해당 기관의 공식 화면에서 제출해야 해요.",
                    false,
                    program.getApplyUrl());
        }

        return new ApplicationChannel(
                "PREPARATION_ONLY",
                "신청서 준비 가능",
                "기관 접수 API가 연결되면 이 화면에서 바로 제출할 수 있어요.",
                false,
                null);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
