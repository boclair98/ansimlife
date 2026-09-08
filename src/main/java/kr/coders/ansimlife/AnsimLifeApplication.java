package kr.coders.ansimlife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AnsimLifeApplication {

    public static void main(String[] args) {
        SpringApplication.run(AnsimLifeApplication.class, args);
    }
}
