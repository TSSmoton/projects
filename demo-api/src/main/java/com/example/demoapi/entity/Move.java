package com.example.demoapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Move {
    @Id
    private Integer id;
    private String name;      // 技の日本語名
    private String type;      // タイプ
    private String category;  // 分類 (physical, special, status)
    private Integer power;    // 威力
    private Integer accuracy; // 命中率
    
    @Column(length = 1000)    // 説明文は長いので文字数を拡張
    private String effect;    // 日本語の効果説明
}