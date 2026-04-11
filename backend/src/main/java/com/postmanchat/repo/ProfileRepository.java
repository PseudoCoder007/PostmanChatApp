package com.postmanchat.repo;

import com.postmanchat.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    @Query("""
            SELECT p FROM Profile p
            WHERE LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(p.username) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY p.displayName ASC
            """)
    List<Profile> searchByDisplayName(@Param("query") String query);

    boolean existsByUsernameIgnoreCase(String username);

    Optional<Profile> findByUsernameIgnoreCase(String username);
}
