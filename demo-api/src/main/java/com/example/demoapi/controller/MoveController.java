package com.example.demoapi.controller;

import com.example.demoapi.entity.Move;
import com.example.demoapi.repository.MoveRepository;
import com.example.demoapi.service.MoveImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 技に関するリクエストを受け付ける窓口（コントローラー）。
 */
@RestController
@RequestMapping("/api/move")
@CrossOrigin(origins = {"http://localhost:3000", "https://projects-nine-azure.vercel.app"})
public class MoveController {

    @Autowired
    private MoveImportService moveImportService;

    @Autowired
    private MoveRepository moveRepository;

    /**
     * PokeAPIから技データをインポートします。
     * 💡 バックグラウンドで実行されます。
     */
    @GetMapping("/import")
    public String importMoves(
        @RequestParam(defaultValue = "1") int start,
        @RequestParam(defaultValue = "1000") int end
    ) {
        new Thread(() -> {
            System.out.println("--- 技インポート開始 ---");
            moveImportService.importMoves(start, end);
            System.out.println("--- 技インポート完了 ---");
        }).start();

        return "技のインポートをバックグラウンドで開始しました。進捗はコンソールを確認してください。";
    }

    /**
     * 技名による「あいまい検索」を行います（フルネーム強制セット等で使用）。
     */
    @GetMapping("/search")
    public List<Move> searchMoves(@RequestParam String name) {
        return moveRepository.findByNameContaining(name);
    }

    /**
     * 指定したポケモンが覚える技のリストを取得します。
     * ダメージ計算機のポケモン選択時に呼び出されます。
     * @param pokemonId ポケモンのID
     * @return 技データのリスト
     */
    @GetMapping("/pokemon/{pokemonId}")
    public List<Move> getMovesByPokemonId(@PathVariable Integer pokemonId) {
        // PokemonRepositoryを経由せず、MoveRepositoryのカスタムクエリで直接取得
        return moveRepository.findByPokemonId(pokemonId);
    }
}