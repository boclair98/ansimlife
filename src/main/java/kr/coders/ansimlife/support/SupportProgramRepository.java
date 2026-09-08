package kr.coders.ansimlife.support;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportProgramRepository extends JpaRepository<SupportProgram, Long> {

    @Query("""
        select p from SupportProgram p
        where (:region = '' or p.region = '전국' or p.region = :region)
          and (:category = '' or p.category = :category)
          and (:keyword = '' or lower(p.title) like lower(concat('%', :keyword, '%'))
               or lower(p.summary) like lower(concat('%', :keyword, '%'))
               or lower(p.target) like lower(concat('%', :keyword, '%'))
               or lower(p.benefit) like lower(concat('%', :keyword, '%')))
        order by p.urgent desc, p.id desc
        """)
    Page<SupportProgram> search(@Param("region") String region,
                                @Param("category") String category,
                                @Param("keyword") String keyword,
                                Pageable pageable);

    @Query("""
        select p from SupportProgram p
        where (:region = '' or p.region = '전국' or p.region = :region)
          and (:category = '' or p.category = :category)
          and (:keyword = '' or lower(p.title) like lower(concat('%', :keyword, '%'))
               or lower(p.summary) like lower(concat('%', :keyword, '%'))
               or lower(p.target) like lower(concat('%', :keyword, '%'))
               or lower(p.benefit) like lower(concat('%', :keyword, '%')))
        order by p.urgent desc, p.id desc
        """)
    List<SupportProgram> searchCandidates(@Param("region") String region,
                                          @Param("category") String category,
                                          @Param("keyword") String keyword);

    @Query("select p.category as category, count(p) as total from SupportProgram p group by p.category order by count(p) desc")
    List<CategoryTotal> categoryTotals();

    Optional<SupportProgram> findByExternalId(String externalId);

    interface CategoryTotal {
        String getCategory();
        long getTotal();
    }
}
