package com.example.demoapi.controller;

import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.PokemonRepository;
import com.example.demoapi.service.PokemonImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pokemon")
@CrossOrigin(origins = {"http://localhost:3000", "https://projects-nine-azure.vercel.app"})
public class PokemonController {

    @Autowired
    private PokemonImportService importService;

    @Autowired
    private PokemonRepository pokemonRepository;

    /*
     * 解説：@GetMapping("/import-all-forms")
     * これにより http://localhost:8080/api/pokemon/import-all-forms というURLが有効になります。
     */
@GetMapping("/import-all-forms")
    public String importAllForms(
        @RequestParam(defaultValue = "1") int start, 
        @RequestParam(defaultValue = "1025") int end 
    ) {
        // 👇 ここをバックグラウンド実行（別の作業員に任せる）
        new Thread(() -> {
            System.out.println("PokeAPIからのインポートを開始します...");
            importService.importWithVarieties(start, end);
            System.out.println("すべてのインポートが完了しました！");
        }).start();

        // 👆 別の作業員に任せたので、ここは一瞬でブラウザに返却される
        return "インポート処理をバックグラウンドで開始しました。ターミナルのログを確認してください。";
    }


    @GetMapping("/all")
    public List<Pokemon> getAllPokemon() {
        // 以前の findAll() ではなく、並び替え版を呼び出す
        return pokemonRepository.findAllByOrderBySpeciesIdAscIdAsc();
    }
    @GetMapping("/search")
    public List<Pokemon> searchPokemon(@RequestParam String name) {
        return pokemonRepository.findByNameContaining(name);
    }
}