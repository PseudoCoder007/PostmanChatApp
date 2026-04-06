package com.postmanchat.repo;

import com.postmanchat.domain.IgrisChatHistory;
import com.postmanchat.domain.Profile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IgrisChatHistoryRepository extends JpaRepository<IgrisChatHistory, UUID> {

    List<IgrisChatHistory> findByProfileOrderByCreatedAtDesc(Profile profile);

    default List<IgrisChatHistory> findTopByProfileOrderByCreatedAtDesc(Profile profile, int limit) {
        return findByProfileOrderByCreatedAtDesc(profile).stream().limit(limit).toList();
    }
}