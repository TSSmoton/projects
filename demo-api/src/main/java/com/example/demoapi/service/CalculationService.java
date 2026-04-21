package com.example.demoapi.service;

import com.example.demoapi.entity.CalculationResult;
import com.example.demoapi.repository.CalculationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CalculationService {

    @Autowired
    private CalculationRepository repository;

    public CalculationResult performCalculation(int n1, int n2, String op) {
        double res = 0;
        
        // 四則演算のロジック
        switch (op) {
            case "+": res = n1 + n2; break;
            case "-": res = n1 - n2; break;
            case "*": res = n1 * n2; break;
            case "/": 
                // 0で割ろうとした時のエラー回避
                res = (n2 != 0) ? (double) n1 / n2 : 0; 
                break;
            default: res = 0;
        }

        CalculationResult data = new CalculationResult();
        data.setNum1(String.valueOf(n1));
        data.setNum2(String.valueOf(n2));
        data.setOperator(op);
        data.setResult(String.valueOf(res));

        return repository.save(data);
    }

    public List<CalculationResult> getHistory() {
        return repository.findAll();
    }
}