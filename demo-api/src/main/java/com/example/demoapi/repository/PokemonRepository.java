package com.example.demoapi.repository;

import com.example.demoapi.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * データベースの「pokemon」テーブルと直接やり取りをするインターフェース。
 * JpaRepositoryを継承しているため、基本的なCRUD（保存・削除・主キー検索など）は自動で実装されます。
 */
@Repository
public interface PokemonRepository extends JpaRepository<Pokemon, Integer> {

    /**
     * ポケモンを全件取得し、図鑑番号順に並べ替えるメソッド。
     * （同じ図鑑番号なら、通常のすがた→メガシンカ等の順になるように id で昇順ソートします）
     * 裏で実行されるSQL: SELECT * FROM pokemon ORDER BY species_id ASC, id ASC;
     * * @return 並び替えられた全ポケモンのリスト
     */
    List<Pokemon> findAllByOrderBySpeciesIdAscIdAsc();

    /**
     * 入力された文字列が「名前の一部に含まれている」ポケモンを検索するメソッド（あいまい検索）。
     * 裏で実行されるSQL: SELECT * FROM pokemon WHERE name LIKE '%name%';
     * * @param name 検索したいポケモンの名前（例: "フシギ"）
     * @return 名前が一致したポケモンのリスト
     */
    List<Pokemon> findByNameContaining(String name);
}