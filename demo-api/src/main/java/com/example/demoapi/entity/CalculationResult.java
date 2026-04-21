package com.example.demoapi.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import java.time.LocalDateTime;

@Entity // 「これはDBのテーブルになるクラス」という印
@Data   // LombokがGetter/Setterを自動で作ってくれる
public class CalculationResult {

    @Id // 主キー（背番号）
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自動で番号を振る
    private Long id;

    private String num1;    // 入力値1
    private String num2;    // 入力値2
    private String operator; // 演算子 (+, -, *, /)
    private String result;   // 計算結果

    private LocalDateTime createdAt = LocalDateTime.now(); // 計算した日時
}