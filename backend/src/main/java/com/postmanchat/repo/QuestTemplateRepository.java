package com.postmanchat.repo;

import com.postmanchat.domain.QuestTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface QuestTemplateRepository extends JpaRepository<QuestTemplate, UUID> {

    @Query("""
            SELECT q FROM QuestTemplate q
            WHERE q.active = true
            ORDER BY q.minLevel ASC, q.title ASC
            """)
    List<QuestTemplate> findActiveTemplates();
}
