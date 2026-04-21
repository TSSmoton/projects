package com.example.demoapi.repository;

import com.example.demoapi.entity.CalculationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// これだけで「保存・検索・削除」ができる魔法のリモコンが手に入ります
public interface CalculationRepository extends JpaRepository<CalculationResult, Long> {
}