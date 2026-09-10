package kr.coders.ansimlife.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_profiles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_profile_user_id",
                columnNames = "user_id"))
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String region;

    @Column(nullable = false, length = 20)
    private String ageGroup;

    @Column(nullable = false, length = 40)
    private String household;

    @Column(nullable = false, length = 40)
    private String need;

    @Column(length = 40)
    private String incomeRange;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected UserProfile() {
    }

    public UserProfile(Long userId, String region, String ageGroup, String household,
                       String need, String incomeRange) {
        this.userId = userId;
        update(region, ageGroup, household, need, incomeRange);
    }

    public void update(String region, String ageGroup, String household,
                       String need, String incomeRange) {
        this.region = region;
        this.ageGroup = ageGroup;
        this.household = household;
        this.need = need;
        this.incomeRange = incomeRange;
    }

    @PrePersist
    void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getRegion() { return region; }
    public String getAgeGroup() { return ageGroup; }
    public String getHousehold() { return household; }
    public String getNeed() { return need; }
    public String getIncomeRange() { return incomeRange; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
