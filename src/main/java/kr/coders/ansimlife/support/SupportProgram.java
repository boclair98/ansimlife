package kr.coders.ansimlife.support;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "support_programs")
public class SupportProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 80)
    private String externalId;

    @Column(length = 200)
    private String title;

    @Column(length = 30)
    private String region;

    @Column(length = 30)
    private String category;

    @Column(length = 220)
    private String target;

    @Column(length = 300)
    private String summary;

    @Column(length = 300)
    private String benefit;

    @Column(length = 500)
    private String applyUrl;

    @Column(length = 180)
    private String deadline;
    private boolean urgent;

    protected SupportProgram() {
    }

    public SupportProgram(String title, String region, String category, String target,
                           String summary, String benefit, String applyUrl,
                           String deadline, boolean urgent) {
        this.title = title;
        this.region = region;
        this.category = category;
        this.target = target;
        this.summary = summary;
        this.benefit = benefit;
        this.applyUrl = applyUrl;
        this.deadline = deadline;
        this.urgent = urgent;
    }

    public SupportProgram(String externalId, String title, String region, String category,
                          String target, String summary, String benefit, String applyUrl,
                          String deadline, boolean urgent) {
        this.externalId = externalId;
        sync(title, region, category, target, summary, benefit, applyUrl, deadline, urgent);
    }

    public void sync(String title, String region, String category, String target,
                     String summary, String benefit, String applyUrl,
                     String deadline, boolean urgent) {
        this.title = title;
        this.region = region;
        this.category = category;
        this.target = target;
        this.summary = summary;
        this.benefit = benefit;
        this.applyUrl = applyUrl;
        this.deadline = deadline;
        this.urgent = urgent;
    }

    public Long getId() {
        return id;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getTitle() {
        return title;
    }

    public String getRegion() {
        return region;
    }

    public String getCategory() {
        return category;
    }

    public String getTarget() {
        return target;
    }

    public String getSummary() {
        return summary;
    }

    public String getBenefit() {
        return benefit;
    }

    public String getApplyUrl() {
        return applyUrl;
    }

    public String getDeadline() {
        return deadline;
    }

    public boolean isUrgent() {
        return urgent;
    }
}
