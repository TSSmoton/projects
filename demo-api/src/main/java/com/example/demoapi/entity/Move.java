package com.example.demoapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

/**
 * 技データを表すエンティティ
 */
@Entity
@Getter
@Setter
public class Move {
    
    /** 技のID（PokeAPIの技IDと一致します） */
    @Id
    private Integer id;
    
    /** 技の日本語名（例: "じしん"） */
    private String name;      
    
    /** 技のタイプ（例: "じめん"） */
    private String type;      
    
    /** 技の分類（"物理", "特殊", "変化"） */
    private String category;  
    
    /** 威力（変化技など威力がない場合は0やnullが入る想定です） */
    private Integer power;    
    
    /** 命中率（必中技の場合はnullなどが入る想定です） */
    private Integer accuracy; 
    
    /** * 技の詳しい効果説明（日本語）。
     * 最大文字数を超えることがあるため、余裕を持って1000文字に拡張しています。
     */
    @Column(length = 1000)
    private String effect;    
}