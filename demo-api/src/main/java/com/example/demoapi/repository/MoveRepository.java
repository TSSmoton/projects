package com.example.demoapi.repository;

import com.example.demoapi.entity.Move;
import com.example.demoapi.entity.Pokemon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MoveRepository extends JpaRepository<Move, Integer> {
      List<Move> findByNameContaining(String name);

}