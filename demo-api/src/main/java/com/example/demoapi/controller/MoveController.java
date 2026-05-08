package com.example.demoapi.controller;

import com.example.demoapi.entity.Move;
import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.MoveRepository;
import com.example.demoapi.service.MoveImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/move")
@CrossOrigin(origins = {"http://localhost:3000", "https://projects-nine-azure.vercel.app"}) // ✅ フロントのURLを両方許可
public class MoveController {

    @Autowired
    private MoveImportService moveImportService;
    @Autowired
    private MoveRepository moveRepository;

@GetMapping("/import")
    public String importMoves(
        @RequestParam(defaultValue = "1") int start, 
        @RequestParam(defaultValue = "1000") int end // 技は現在900種類ちょっとあります
    ) {
        // 👇 バックグラウンドで実行させる魔法
        new Thread(() -> {
            System.out.println("PokeAPIからの【技】インポートを開始します...");
            moveImportService.importMoves(start, end);
            System.out.println("【技】のインポートがすべて完了しました！");
        }).start();

        return "技のインポートをバックグラウンドで開始しました。ターミナルのログを確認してください。";
    }
    @GetMapping("/search")
    public List<Move> searchMoves(@RequestParam String name) {
        return moveRepository.findByNameContaining(name);
    }
// 「/api/move/pokemon/445」のように叩くと、ガブリアス(445)の技一覧が返る！
    @GetMapping("/pokemon/{pokemonId}")
    public List<Move> getMovesByPokemonId(@PathVariable Integer pokemonId) {
        return moveRepository.findByPokemonId(pokemonId);
    }

    
}

