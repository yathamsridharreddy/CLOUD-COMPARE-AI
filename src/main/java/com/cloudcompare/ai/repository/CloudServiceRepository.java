package com.cloudcompare.ai.repository;

import com.cloudcompare.ai.entity.CloudServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CloudServiceRepository extends JpaRepository<CloudServiceEntity, Long> {
    List<CloudServiceEntity> findByCategoryAndServiceType(String category, String serviceType);
    List<CloudServiceEntity> findByCategory(String category);
}
