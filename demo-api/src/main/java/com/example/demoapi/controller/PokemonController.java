package com.example.demoapi.controller;

import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.PokemonRepository;
import com.example.demoapi.service.PokemonImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * ポケモンに関するリクエストを受け付ける窓口（コントローラー）。
 * フロントエンドからの検索リクエストや、データインポートの指示を処理します。
 */
@RestController
@RequestMapping("/api/pokemon")
// 開発環境(3000番)と本番環境(Vercel)の両方からのアクセスを許可
@CrossOrigin(origins = {"http://localhost:3000", "https://projects-nine-azure.vercel.app"})
public class PokemonController {

    @Autowired
    private PokemonImportService importService;

    @Autowired
    private PokemonRepository pokemonRepository;

    /**
     * PokeAPIから全ポケモン（フォルム違い含む）をインポートします。
     * 💡 非常に時間がかかるため、バックグラウンドで処理を開始し、即座に応答を返します。
     * URL例: http://localhost:8080/api/pokemon/import-all-forms?start=1&end=1025
     */
    @GetMapping("/import-all-forms")
    public String importAllForms(
        @RequestParam(defaultValue = "1") int start,
        @RequestParam(defaultValue = "1025") int end
    ) {
        // 別スレッドで実行することで、ブラウザを「待ち」状態にさせない
        new Thread(() -> {
            System.out.println("--- ポケモンインポート開始 ---");
            importService.importWithVarieties(start, end);
            System.out.println("--- ポケモンインポート完了 ---");
        }).start();

        return "ポケモンのインポート処理をバックグラウンドで開始しました。進捗はコンソールを確認してください。";
    }

    /**
     * 登録されている全ポケモンを取得します。
     * speciesId（全国図鑑番号）順に並べ替えられた状態で返ります。
     */
    @GetMapping("/all")
    public List<Pokemon> getAllPokemon() {
        return pokemonRepository.findAllByOrderBySpeciesIdAscIdAsc();
    }

    /**
     * ポケモン名による「あいまい検索」を行います。
     * @param name 検索したい名前の一部（例: "フシギ"）
     * @return 一致したポケモンのリスト
     */
    @GetMapping("/search")
    public List<Pokemon> searchPokemon(@RequestParam String name) {
        return pokemonRepository.findByNameContaining(name);
    }
}