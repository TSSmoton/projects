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
@CrossOrigin(origins = "http://localhost:3000")
public class MoveController {

    @Autowired
    private MoveImportService moveImportService;
    @Autowired
    private MoveRepository moveRepository;

    @GetMapping("/import")
    public String importMoves(@RequestParam int start, @RequestParam int end) {
        moveImportService.importMoves(start, end);
        return "技のインポートを開始しました。";
    }
    @GetMapping("/search")
    public List<Move> searchMoves(@RequestParam String name) {
        return moveRepository.findByNameContaining(name);
    }


    
}

