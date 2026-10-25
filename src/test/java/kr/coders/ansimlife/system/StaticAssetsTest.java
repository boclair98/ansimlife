package kr.coders.ansimlife.system;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@SpringBootTest
@AutoConfigureMockMvc
class StaticAssetsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeResolvesThePublishedDocument() throws Exception {
        mockMvc.perform(get("/")).andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl("index.html"));
        mockMvc.perform(get("/index.html")).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-cache")))
                .andExpect(result -> assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                        .contains("내 생활에 필요한 혜택"));
    }

    @Test
    void visualAndInteractionAssetsAreServedAlongsideTheApi() throws Exception {
        for (String path : new String[]{"/app.js", "/app.css", "/dialogs.css",
                "/workspace.js", "/workspace.css", "/workflow-core.js", "/service.css", "/service-ui.js",
                "/prototype/assets/seoul-city.jpg", "/favicon.svg",
                "/fonts/PretendardVariable.woff2"}) {
            mockMvc.perform(get(path)).andExpect(status().isOk());
        }
    }
}
