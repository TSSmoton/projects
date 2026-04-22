package com.example.demoapi.entity; // 1行目は必ずこれ

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

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
}