package com.example.demoapi.controller;

import com.example.demoapi.entity.CalculationResult;
import com.example.demoapi.service.CalculationService; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/calculator")
@CrossOrigin(origins = "http://localhost:3000")
public class CalculationController {

    @Autowired // 「自動で準備してね」という呪文
    private CalculationService calculationService; 
    @GetMapping("/calculate")
    public CalculationResult calculate(@RequestParam int n1, @RequestParam int n2, @RequestParam String op) {
        // ここで calculationService を使うので、上で宣言しておく必要があります
        return calculationService.performCalculation(n1, n2, op);
    }

    @GetMapping("/history")
    public List<CalculationResult> history() {
        return calculationService.getHistory();
    }
}