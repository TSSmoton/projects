package com.example.demoapi.repository;

import com.example.demoapi.entity.Move;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * データベースの「move」テーブルとやり取りをするインターフェース。
 */
@Repository
public interface MoveRepository extends JpaRepository<Move, Integer> {

    /**
     * 技名の一部から、該当する技を検索するメソッド（あいまい検索）。
     * 裏で実行されるSQL: SELECT * FROM move WHERE name LIKE '%name%';
     * * @param name 検索したい技の名前（例: "じしん"）
     * @return 該当する技のリスト
     */
    List<Move> findByNameContaining(String name);

    /**
     * 指定したポケモンのIDから、そのポケモンが「覚える技」をすべて取得するメソッド。
     * * 【処理の仕組み】
     * 中間テーブル（pokemon_moves）を自動的に経由し、
     * 「該当するポケモンに紐づいている技のデータ」だけを直接引っ張ってくる高効率なクエリ（JPQL）です。
     * * @param pokemonId 技を調べたいポケモンのID
     * @return そのポケモンが覚える全技のリスト
     */
    @Query("SELECT m FROM Pokemon p JOIN p.learnableMoves m WHERE p.id = :pokemonId")
    List<Move> findByPokemonId(@Param("pokemonId") Integer pokemonId);
}