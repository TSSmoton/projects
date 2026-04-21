package com.example.demoapi.controller;

import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.PokemonRepository;
import com.example.demoapi.service.PokemonImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pokemon")
@CrossOrigin(origins = "http://localhost:3000")
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
        @RequestParam(defaultValue = "1") int start, // URLの?start=...を受け取る。無ければ1
        @RequestParam(defaultValue = "1025") int end   // URLの?end=...を受け取る。無ければ151
    ) {
        // Service側の「メガシンカ対応版」メソッドを呼び出す
        importService.importWithVarieties(start, end);
        return "インポート処理を開始しました。ターミナルのログを確認してください。";
    }

    @GetMapping("/all")
    public List<Pokemon> getAllPokemon() {
        return pokemonRepository.findAll();
    }
}