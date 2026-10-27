package kr.coders.ansimlife.support;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/** Renders public notice text only. No account, draft or receipt data enters this service. */
@Service
public class BenefitGuidePdfService {
    private static final Color INK = new Color(32, 43, 61);
    private static final Color MUTED = new Color(101, 113, 135);
    private static final Color BLUE = new Color(0, 127, 95);
    private final byte[] regular;
    private final byte[] bold;

    public BenefitGuidePdfService(@Value("${ansimlife.pdf.font-directory:}") String fontDirectory) throws IOException {
        regular = readFont(fontDirectory, "WantedSans-Regular.ttf");
        bold = readFont(fontDirectory, "WantedSans-Bold.ttf");
    }

    private static byte[] readFont(String directory, String name) throws IOException {
        Resource resource = directory.isBlank() ? new ClassPathResource("pdf-fonts/" + name)
                : new FileSystemResource(Path.of(directory).resolve(name));
        try (var input = resource.getInputStream()) { return input.readAllBytes(); }
    }

    public byte[] render(SupportProgram program, PublicServiceDetailService.ProgramDetail detail) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.getDocumentInformation().setTitle(program.getTitle());
            document.getDocumentInformation().setAuthor("안심생활");
            document.getDocumentInformation().setSubject("공공혜택 확인 및 신청 준비 안내");
            PDType0Font bodyFont = PDType0Font.load(document, new ByteArrayInputStream(regular));
            PDType0Font titleFont = PDType0Font.load(document, new ByteArrayInputStream(bold));
            String today = LocalDate.now(ZoneId.of("Asia/Seoul")).toString();
            try (Layout layout = new Layout(document, bodyFont, titleFont)) {
                layout.title(program.getTitle());
                layout.paragraph(program.getRegion() + " · " + program.getCategory() + " · 조회 " + today, 9.5f, MUTED);
                layout.notice("신청 준비를 돕는 참고자료입니다. 최종 대상·기간·서류는 공식 기관에서 확인해주세요. 실제 신청서는 공식 접수처에 제출해야 합니다.");
                layout.section("어떤 혜택인가요?", first(detail.purpose(), detail.summary()));
                layout.section("지원 대상", detail.target());
                layout.section("지원 내용", detail.benefit());
                layout.section("선정 기준", detail.criteria());
                layout.section("신청 기간", detail.deadline());
                layout.section("신청 방법", detail.applicationMethod());
                layout.section("직접 준비할 서류", detail.requiredDocuments());
                layout.section("담당자가 확인할 서류", detail.officialDocuments());
                layout.section("본인 동의로 확인할 서류", detail.identityDocuments());
                layout.section("접수·문의", String.join(" · ", List.of(value(detail.agency()), value(detail.department()),
                        value(detail.receptionAgency()), value(detail.contact())).stream().filter(s -> !s.isBlank()).distinct().toList()));
                layout.section("신청 전 확인할 일", "1. 지원 대상과 선정 기준 확인\n2. 현재 모집 여부와 필요한 서류 확인\n3. 공식 접수처에서 최종 조건을 확인한 후 신청");
                String source = safeUrl(detail.onlineUrl(), program.getApplyUrl());
                layout.section("공식 출처", (detail.sourceLive() ? "공식 상세정보 조회" : "마지막 저장 정보 기준")
                        + (detail.sourceUpdatedAt() == null || detail.sourceUpdatedAt().isBlank() ? "" : " · 원문 수정 " + detail.sourceUpdatedAt())
                        + "\n" + (source == null ? "상세 안내의 문의처에서 신청 경로를 확인해주세요." : source));
            }
            int total = document.getNumberOfPages();
            for (int i = 0; i < total; i++) {
                try (var footer = new PDPageContentStream(document, document.getPage(i), PDPageContentStream.AppendMode.APPEND, true)) {
                    footer.setStrokingColor(new Color(231, 236, 243));
                    footer.moveTo(50, 46); footer.lineTo(545, 46); footer.stroke();
                    write(footer, bodyFont, 8.5f, MUTED, 50, 31, "안심생활 · 조회 " + today + " · 최종 기준은 공식 공고에서 확인");
                    write(footer, bodyFont, 8.5f, MUTED, 503, 31, (i + 1) + " / " + total);
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private static String value(String text) { return text == null ? "" : text; }
    private static String first(String a, String b) { return a == null || a.isBlank() ? b : a; }
    private static String safeUrl(String... values) {
        for (String value : values) {
            if (value == null || value.isBlank()) continue;
            try {
                URI uri = URI.create(value.trim());
                if (("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                        && uri.getHost() != null && uri.getUserInfo() == null) return uri.toString();
            } catch (IllegalArgumentException ignored) { /* Try the next published source. */ }
        }
        return null;
    }

    private static void write(PDPageContentStream stream, PDFont font, float size, Color color, float x, float y, String text) throws IOException {
        stream.beginText(); stream.setFont(font, size); stream.setNonStrokingColor(color);
        stream.newLineAtOffset(x, y); stream.showText(text); stream.endText();
    }

    private static final class Layout implements AutoCloseable {
        private final PDDocument document;
        private final PDFont bodyFont;
        private final PDFont titleFont;
        private PDPageContentStream stream;
        private float y;
        private Layout(PDDocument document, PDFont bodyFont, PDFont titleFont) throws IOException {
            this.document = document; this.bodyFont = bodyFont; this.titleFont = titleFont; newPage();
        }
        private void newPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4); document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - 54;
            write(stream, titleFont, 9, BLUE, 50, y, "안심생활  /  혜택 확인 안내문"); y -= 35;
        }
        private void need(float height) throws IOException { if (y - height < 66) newPage(); }
        private String supported(String text, PDFont font) throws IOException {
            StringBuilder result = new StringBuilder();
            for (int cp : value(text).replace("\r", "").codePoints().toArray()) {
                if (cp == '\n') { result.append('\n'); continue; }
                if (Character.isISOControl(cp)) { result.append(' '); continue; }
                String character = new String(Character.toChars(cp));
                try { font.encode(character); result.append(character); }
                catch (IllegalArgumentException exception) { result.append('?'); }
            }
            return result.toString();
        }
        private List<String> wrap(String text, PDFont font, float size, float width) throws IOException {
            List<String> lines = new ArrayList<>(); StringBuilder line = new StringBuilder(); float used = 0;
            for (int cp : supported(text, font).codePoints().toArray()) {
                String character = new String(Character.toChars(cp));
                if (cp == '\n') { lines.add(line.toString().stripTrailing()); line.setLength(0); used = 0; continue; }
                float advance = font.getStringWidth(character) / 1000f * size;
                if (used + advance > width && !line.isEmpty()) {
                    int space = line.lastIndexOf(" ");
                    if (space > 0) {
                        lines.add(line.substring(0, space).stripTrailing());
                        String carry = line.substring(space + 1); line.setLength(0); line.append(carry);
                        used = font.getStringWidth(carry) / 1000f * size;
                    } else { lines.add(line.toString().stripTrailing()); line.setLength(0); used = 0; }
                }
                if (line.isEmpty() && Character.isWhitespace(cp)) continue;
                line.append(character); used += advance;
            }
            if (!line.isEmpty()) lines.add(line.toString().stripTrailing());
            return lines;
        }
        private void title(String text) throws IOException {
            for (String line : wrap(text, titleFont, 23, 495)) { need(32); write(stream, titleFont, 23, INK, 50, y, line); y -= 32; }
            y -= 6;
        }
        private void paragraph(String text, float size, Color color) throws IOException {
            for (String line : wrap(text, bodyFont, size, 495)) { need(18); write(stream, bodyFont, size, color, 50, y, line); y -= 18; }
        }
        private void notice(String text) throws IOException {
            List<String> lines = wrap(text, bodyFont, 10, 465); float height = lines.size() * 17 + 22;
            y -= 15; need(height + 12);
            stream.setNonStrokingColor(new Color(241, 247, 243)); stream.addRect(50, y - height + 8, 495, height); stream.fill();
            y -= 9;
            for (String line : lines) { write(stream, bodyFont, 10, INK, 65, y, line); y -= 17; }
            y -= 16;
        }
        private void section(String heading, String text) throws IOException {
            if (text == null || text.isBlank()) return;
            need(70); y -= 14;
            write(stream, titleFont, 11.5f, BLUE, 50, y, heading); y -= 23;
            paragraph(text, 10.5f, INK);
        }
        @Override public void close() throws IOException { if (stream != null) stream.close(); }
    }
}
