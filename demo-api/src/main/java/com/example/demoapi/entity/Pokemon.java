package com.example.demoapi.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

/**
 * ポケモンの基本データを表すエンティティ（DBのテーブルと連動するクラス）
 */
@Entity
//データを取得、更新するためのメソッドを自動生成するLombokのアノテーション
//（例: getId(), setId(Integer id), getName(), setName(String name)など）
@Getter
@Setter
public class Pokemon {

    /** * ポケモンの一意のID 
     * （フォルム違いも別IDとして扱われます。例: フシギバナ=3, メガフシギバナ=10033等） 
     */
    @Id
    private Integer id;

    /** * 全国図鑑番号 
     * （フシギバナもメガフシギバナも同じ「3」になります。フォルムチェンジの検索に便利です） 
     */
    private Integer speciesId;

    /** ポケモンの名前（例: "メガフシギバナ"） */
    private String name;

    // --- タイプ情報 ---
    /** 第1タイプ（必須） */
    private String type1;
    /** 第2タイプ（単タイプの場合はnullになります） */
    private String type2;

    // --- 特性情報 ---
    /** 通常特性1 */
    private String ability1;
    /** 通常特性2（ない場合はnullになります） */
    private String ability2;
    /** 夢特性（隠れ特性） */
    private String hiddenAbility;

    /** 体重（kg）。くさむすび・けたぐり等のダメージ計算に使用します */
    private Double weight; 

    // --- 種族値 ---
    private Integer hp;
    private Integer attack;
    private Integer defense;
    private Integer spAttack;
    private Integer spDefense;
    private Integer speed;

    /** 合計種族値（フロントエンドでのソートやフィルタリングで活躍します） */
    private Integer totalStats;

    // --- 覚える技リスト ---
    /**
     * 「1匹のポケモンが複数の技を覚え、1つの技を複数のポケモンが覚える」多対多の設定。
     */
    @ManyToMany
    @JoinTable(
        name = "pokemon_moves", // DBに自動生成される中間テーブルの名前
        joinColumns = @JoinColumn(name = "pokemon_id"), // このポケモン側のキー
        inverseJoinColumns = @JoinColumn(name = "move_id") // 紐づく技側のキー
    )
    @ToString.Exclude // 💡 超重要：ログ出力時に技リストまで全読み込みしてサーバーが落ちるのを防ぐ
    private List<Move> learnableMoves;
}