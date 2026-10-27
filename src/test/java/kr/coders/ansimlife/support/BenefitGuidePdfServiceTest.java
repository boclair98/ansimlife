package kr.coders.ansimlife.support;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class BenefitGuidePdfServiceTest {
    @Test
    void koreanFontAndSourceSurviveLongDocumentPagination() throws Exception {
        var program = new SupportProgram("공공혜택 안내", "서울", "주거·자립", "시민", "안내", "지원", "https://gov.example/apply", "상시", false);
        String longText = "한글 지원 내용과 선정 기준을 차근차근 확인해주세요.\n".repeat(110) + "문서의 마지막 내용";
        byte[] bytes = new BenefitGuidePdfService("").render(program, detail(longText, "https://gov.example/" + "path/".repeat(60)));
        try (var document = Loader.loadPDF(bytes)) {
            assertThat(document.getNumberOfPages()).isGreaterThan(2);
            String text = new PDFTextStripper().getText(document);
            assertThat(text.replaceAll("\\s", "")).contains("공공혜택안내", "문서의마지막내용", "최종기준은공식공고에서확인");
            assertThat(text).contains("https://gov.example/");
            assertThat(document.getPage(0).getResources().getFontNames()).isNotEmpty();
            for (var name : document.getPage(0).getResources().getFontNames()) {
                assertThat(document.getPage(0).getResources().getFont(name).isEmbedded()).isTrue();
            }
        }
    }

    @Test
    void unsupportedSymbolsAndUnsafeSourceDoNotBreakOrLeakIntoGuide() throws Exception {
        var program = new SupportProgram("건강 혜택", "전국", "보건·의료", "시민", "안내", "지원", "", "상시", false);
        byte[] bytes = new BenefitGuidePdfService("").render(program, detail("원문 기호 🤔 와 한글", "https://user:password@example.com/"));
        try (var document = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(document);
            assertThat(text).contains("건강 혜택", "한글");
            assertThat(text).doesNotContain("password", "user:");
        }
    }

    @Test
    void containerFontDirectoryProducesEmbeddedKoreanPdf(@TempDir Path directory) throws Exception {
        for (String name : new String[]{"WantedSans-Regular.ttf", "WantedSans-Bold.ttf"}) {
            try (var input = new ClassPathResource("pdf-fonts/" + name).getInputStream()) {
                Files.copy(input, directory.resolve(name));
            }
        }
        var program = new SupportProgram("생활 혜택 안내", "전국", "생활안정", "시민", "안내", "지원", "", "상시", false);
        byte[] bytes = new BenefitGuidePdfService(directory.toString()).render(program, detail("한글 지원 내용", ""));
        try (var document = Loader.loadPDF(bytes)) {
            assertThat(new PDFTextStripper().getText(document)).contains("생활 혜택 안내", "한글 지원 내용");
            for (var name : document.getPage(0).getResources().getFontNames()) {
                assertThat(document.getPage(0).getResources().getFont(name).isEmbedded()).isTrue();
            }
        }
    }

    private PublicServiceDetailService.ProgramDetail detail(String benefit, String url) {
        return new PublicServiceDetailService.ProgramDetail("혜택 안내", "생활을 위한 안내", "시민 누구나", benefit,
                "공식 기준 확인", "공식 기관에 신청", "상시", "담당기관", null, null, "기관 문의처 확인",
                "공식 서류 확인", null, null, url, null, "2026-10-27", false);
    }
}
