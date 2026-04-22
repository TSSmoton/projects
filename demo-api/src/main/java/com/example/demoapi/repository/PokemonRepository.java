package com.example.demoapi.repository; // 1行目は必ずこれ

import com.example.demoapi.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PokemonRepository extends JpaRepository<Pokemon, Integer> {
    // これだけで保存や検索ができるようになります
    List<Pokemon> findAllByOrderBySpeciesIdAscIdAsc();
    List<Pokemon> findByNameContaining(String name);
}