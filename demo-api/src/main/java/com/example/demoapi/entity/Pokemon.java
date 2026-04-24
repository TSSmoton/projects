package com.example.demoapi.entity; // 1行目は必ずこれ

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import lombok.Data;

import java.util.List;
@Entity
@Data
public class Pokemon {
    @Id
    private Integer id;
    private Integer speciesId;
    private String name;
    private String type1;
    private String type2;
    private String ability1;
    private String ability2;
    private String hiddenAbility;

    private Double weight; 

    private Integer hp;
    private Integer attack;
    private Integer defense;
    private Integer spAttack;
    private Integer spDefense;
    private Integer speed;
    private Integer totalStats;

    // 「1匹のポケモンが複数の技を覚え、1つの技を複数のポケモンが覚える」多対多の設定
    @ManyToMany
    @JoinTable(
        name = "pokemon_moves", // DBに自動生成される中間テーブルの名前
        joinColumns = @JoinColumn(name = "pokemon_id"), // ポケモン側のキー
        inverseJoinColumns = @JoinColumn(name = "move_id") // 技側のキー
    )
    private List<Move> learnableMoves; // このポケモンが覚える技のリスト
}