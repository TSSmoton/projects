package com.example.demoapi.repository;

import com.example.demoapi.entity.Move;
import com.example.demoapi.entity.Pokemon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MoveRepository extends JpaRepository<Move, Integer> {
      List<Move> findByNameContaining(String name);
      // ✅ ポケモンIDを指定して、そのポケモンが覚える技リストを取得するJPQL
    @Query("SELECT m FROM Pokemon p JOIN p.learnableMoves m WHERE p.id = :pokemonId")
    List<Move> findByPokemonId(@Param("pokemonId") Integer pokemonId);

}