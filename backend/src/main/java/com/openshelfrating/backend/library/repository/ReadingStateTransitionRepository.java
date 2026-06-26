package com.openshelfrating.backend.library.repository;

import com.openshelfrating.backend.library.domain.ReadingStateTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReadingStateTransitionRepository extends JpaRepository<ReadingStateTransition, UUID> {
}
