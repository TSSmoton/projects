"use client";

import { useState, useRef, useEffect } from "react";
import PokemonSearch from "../src/components/PokemonSearch";
import MoveSearch from "../src/components/MoveSearch";
import Image from "next/image";

// ==========================================
// 🛡️ 型定義（Type Definitions）
// ==========================================

export interface Pokemon {
  id: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  type1: string;
  type2?: string;
  ability1: string;
  ability2?: string | null;
  hiddenAbility?: string | null;
  weight?: number; // けたぐり・くさむすび等で使用
}

export interface Move {
  id: number;
  name: string;
  type: string;
  category: "物理" | "特殊" | "変化";
  power: number;
  isContact?: boolean;   // かたいツメ等の接触判定用
  targetStat?: "def";    // サイコショック等の防御参照判定用
  minHits?: number;      // 連続技の最小回数
  maxHits?: number;      // 連続技の最大回数
  isWaterPowerUp?: boolean; // すいほう等の補正用
  accuracy?: number; 
  effect?: string;   
}

interface Item {
  name: string;
  multiplier: number;
  type: "atk" | "dmg" | "speed" | "spa" | "spd" | "none" | "heal"; // どの計算フェーズで倍率をかけるか
}

// ==========================================
// 📊 定数・データベース（Constants）
// ==========================================

// タイプ相性表（攻撃側タイプ -> 防御側タイプ -> 倍率）
const TYPE_CHART: Record<string, Record<string, number>> = {
  ノーマル: { いわ: 0.5, ゴースト: 0, はがね: 0.5 },
  ほのお: { ほのお: 0.5, みず: 0.5, くさ: 2, こおり: 2, むし: 2, いわ: 0.5, ドラゴン: 0.5, はがね: 2 },
  みず: { ほのお: 2, みず: 0.5, くさ: 0.5, じめん: 2, いわ: 2, ドラゴン: 0.5 },
  でんき: { みず: 2, でんき: 0.5, くさ: 0.5, じめん: 0, ひこう: 2, ドラゴン: 0.5 },
  くさ: { ほのお: 0.5, みず: 2, くさ: 0.5, どく: 0.5, じめん: 2, ひこう: 0.5, むし: 0.5, いわ: 2, ドラゴン: 0.5, はがね: 0.5 },
  こおり: { ほのお: 0.5, みず: 0.5, くさ: 2, こおり: 0.5, じめん: 2, ひこう: 2, ドラゴン: 2, はがね: 0.5 },
  かくとう: { ノーマル: 2, こおり: 2, どく: 0.5, ひこう: 0.5, エスパー: 0.5, むし: 0.5, いわ: 2, ゴースト: 0, あく: 2, はがね: 2, フェアリー: 0.5 },
  どく: { くさ: 2, どく: 0.5, じめん: 0.5, いわ: 0.5, ゴースト: 0.5, はがね: 0, フェアリー: 2 },
  じめん: { ほのお: 2, でんき: 2, くさ: 0.5, どく: 2, ひこう: 0, むし: 0.5, いわ: 2, はがね: 2 },
  ひこう: { でんき: 0.5, くさ: 2, かくとう: 2, むし: 2, いわ: 0.5, はがね: 0.5 },
  エスパー: { かくとう: 2, どく: 2, エスパー: 0.5, あく: 0, はがね: 0.5 },
  むし: { あく: 2, エスパー: 2, くさ: 2, ほのお: 0.5, かくとう: 0.5, どく: 0.5, ひこう: 0.5, ゴースト: 0.5, はがね: 0.5, フェアリー: 0.5 },
  いわ: { ほのお: 2, こおり: 2, かくとう: 0.5, じめん: 0.5, ひこう: 2, むし: 2, はがね: 0.5 },
  ゴースト: { ノーマル: 0, エスパー: 2, ゴースト: 2, あく: 0.5 },
  ドラゴン: { ドラゴン: 2, はがね: 0.5, フェアリー: 0 },
  あく: { かくとう: 0.5, エスパー: 2, ゴースト: 2, あく: 0.5, フェアリー: 0.5 },
  はがね: { ほのお: 0.5, みず: 0.5, でんき: 0.5, こおり: 2, いわ: 2, はがね: 0.5, フェアリー: 2 },
  フェアリー: { ほのお: 0.5, かくとう: 2, どく: 0.5, ドラゴン: 2, あく: 2, はがね: 0.5 },
};

// タイプごとの色定義（UI表示用）
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ノーマル: { bg: "#A8A878", text: "#fff" },
  ほのお: { bg: "#F08030", text: "#fff" },
  みず: { bg: "#6890F0", text: "#fff" },
  でんき: { bg: "#F8D030", text: "#333" }, 
  くさ: { bg: "#78C850", text: "#fff" },
  こおり: { bg: "#98D8D8", text: "#333" }, 
  かくとう: { bg: "#C03028", text: "#fff" },
  どく: { bg: "#A040A0", text: "#fff" },
  じめん: { bg: "#E0C068", text: "#333" }, 
  ひこう: { bg: "#A890F0", text: "#fff" },
  エスパー: { bg: "#F85888", text: "#fff" },
  むし: { bg: "#A8B820", text: "#fff" },
  いわ: { bg: "#B8A038", text: "#fff" },
  ゴースト: { bg: "#705898", text: "#fff" },
  ドラゴン: { bg: "#4538f8", text: "#fff" },
  あく: { bg: "#705848", text: "#fff" },
  はがね: { bg: "#B8B8D0", text: "#333" }, 
  フェアリー: { bg: "#EE99AC", text: "#fff" },
};

// 持ち物の選択肢
const ITEMS: Item[] = [
  { name: "なし", multiplier: 1.0, type: "none" },
  { name: "命の珠", multiplier: 1.3, type: "dmg" },
  { name: "こだわりハチマキ", multiplier: 1.5, type: "atk" },
  { name: "こだわりメガネ", multiplier: 1.5, type: "spa" },
  { name: "ちからのハチマキ", multiplier: 1.1, type: "dmg" },
  { name: "タイプ強化アイテム", multiplier: 1.2, type: "dmg" },
  { name: "たつじんのおび", multiplier: 1.2, type: "dmg" },
  { name: "とつげきチョッキ", multiplier: 1.5, type: "spd" },
  { name: "オボンの実", multiplier: 0.25, type: "heal" },
  { name: "メガストーン", multiplier: 1, type: "none" },
  { name: "たべのこし", multiplier: 0.0625, type: "heal" },
];

// 計算に影響する特性リスト
const RELEVANT_ABILITIES = [
  { name: "てきおうりょく", multiplier: 2.0 },
  { name: "ちからもち", multiplier: 2.0 },
  { name: "かたいツメ", multiplier: 1.3 },
  { name: "マルチスケイル", multiplier: 0.5 },
  { name: "いかく", multiplier: 1.0 },
  { name: "こんじょう", multiplier: 1.5 },
];

// ランク補正の倍率表（-6〜+6）
const RANK_MODIFIERS: Record<number, number> = {
  "-6": 2 / 8, "-5": 2 / 7, "-4": 2 / 6, "-3": 2 / 5, "-2": 2 / 4, "-1": 2 / 3,
  "0": 1.0,
  "1": 1.5, "2": 2.0, "3": 2.5, "4": 3.0, "5": 3.5, "6": 4.0,
};

// ==========================================
// 🧩 汎用UIコンポーネント（UI Components）
// ==========================================

// 種族値の一覧表示パネル
const BaseStatsSummary = ({ pokemon }: { pokemon: Pokemon }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", fontSize: "0.75rem", backgroundColor: "#eee", padding: "8px", borderRadius: "5px", marginBottom: "10px" }}>
    <div style={{ textAlign: "center" }}>HP: {pokemon.hp}</div>
    <div style={{ textAlign: "center" }}>こうげき: {pokemon.attack}</div>
    <div style={{ textAlign: "center" }}>ぼうぎょ: {pokemon.defense}</div>
    <div style={{ textAlign: "center" }}>とくこう: {pokemon.spAttack}</div>
    <div style={{ textAlign: "center" }}>とくぼう: {pokemon.spDefense}</div>
    <div style={{ textAlign: "center" }}>すばやさ: {pokemon.speed}</div>
  </div>
);

// マウスホイールで画面がスクロールしない安全な数値入力欄
const WheelNumberInput = ({ value, onChange, min = 0, max = 32 }: { value: number; onChange: (val: number) => void; min?: number; max?: number; }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const elem = inputRef.current;
    if (!elem) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); 
      const step = e.deltaY < 0 ? 1 : -1;
      onChange(Math.min(max, Math.max(min, value + step)));
    };
    elem.addEventListener("wheel", handleWheel, { passive: false });
    return () => elem.removeEventListener("wheel", handleWheel);
  }, [value, onChange, min, max]);

  return <input ref={inputRef} type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "60px", color: "black" }} />;
};

// ダメージバー（緑・オレンジ・赤のグラデーションバー）
const DamageBar = ({ hp, minDam, maxDam }: { hp: number; minDam: number; maxDam: number }) => {
  const minPercent = Math.min(100, (minDam / hp) * 100);
  const maxPercent = Math.min(100, (maxDam / hp) * 100);
  const remainingPercent = Math.max(0, 100 - maxPercent);

  return (
    <div style={{ marginTop: "15px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px", color: "#666" }}>
        <span>HPバー</span>
        <span>{Math.max(0, hp - maxDam)} / {hp}</span>
      </div>
      <div style={{ height: "14px", width: "100%", backgroundColor: "#e0e0e0", borderRadius: "7px", overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)" }}>
        {/* 最低残りHP（緑〜赤） */}
        <div style={{ width: `${remainingPercent}%`, height: "100%", backgroundColor: remainingPercent > 50 ? "#4ade80" : remainingPercent > 20 ? "#fbbf24" : "#ef4444", transition: "width 0.3s ease-out" }} />
        {/* 乱数によるダメージのブレ幅（オレンジ） */}
        <div style={{ position: "absolute", left: `${remainingPercent}%`, top: 0, width: `${maxPercent - minPercent}%`, height: "100%", backgroundColor: "#f97316", opacity: 0.8 }} />
        {/* 確定で減るダメージ（赤） */}
        <div style={{ position: "absolute", left: `${remainingPercent + (maxPercent - minPercent)}%`, top: 0, width: `${minPercent}%`, height: "100%", backgroundColor: "#555555", opacity: 0.8 }} />
      </div>
    </div>
  );
};

// タイプアイコン（丸みと影をつけた綺麗なバッジ）
const TypeBadge = ({ type }: { type: string }) => {
  const colors = TYPE_COLORS[type] || { bg: "#666", text: "#fff" }; 
  return (
    <span style={{ display: "inline-block", padding: "2px 5px", borderRadius: "6px", fontSize: "0.5rem", fontWeight: "bold", backgroundColor: colors.bg, color: colors.text, textShadow: colors.text === "#fff" ? "0 1px 1px rgba(0,0,0,0.5)" : "none", marginLeft: "4px", border: "1px solid rgba(0,0,0,0.2)", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
      {type}
    </span>
  );
};

// ==========================================
// 🧮 ユーティリティ関数（Utility Functions）
// ==========================================

const isMega = (name: string | undefined): boolean => {
  if (!name) return false;
  return name.startsWith("メガ") && !["メガニウム", "メガヤンマ"].includes(name);
};

const getAbilitiesArray = (p: Pokemon | null): string[] => {
  if (!p) return ["なし"];
  return [p.ability1, p.ability2, p.hiddenAbility].filter(Boolean) as string[];
};

/**
 * 実数値計算（レベル50固定、個体値31固定）
 * ※努力レベルは 0〜32 を旧システムに合わせた係数(x2)で計算
 */
const calcStat = (base: number, evLevel: number, nature: number, isHp = false) => {
  const iv = 31; 
  const level = 50; 
  const evBonus = evLevel * 2;

  if (isHp) return Math.floor(((base * 2 + iv + evBonus) * level) / 100) + level + 10;
  return Math.floor((Math.floor(((base * 2 + iv + evBonus) * level) / 100) + 5) * nature);
};


// ==========================================
// 🏠 メイン画面コンポーネント（Main Component）
// ==========================================

export default function Home() {
  // --- 1. 基本情報（ポケモン・技） ---
  const [attacker, setAttacker] = useState<Pokemon | null>(null);
  const [defender, setDefender] = useState<Pokemon | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isMoveHovered, setIsMoveHovered] = useState(false);

  // --- 2. 攻撃側の状態管理 ---
  const [atkEv, setAtkEv] = useState(32); 
  const [atkNature, setAtkNature] = useState(1.1);
  const [atkItem, setAtkItem] = useState(ITEMS[0]);
  const [atkAbility, setAtkAbility] = useState("なし");
  const [atkRank, setAtkRank] = useState(0);
  const [isAtkBurned, setIsAtkBurned] = useState(false);

  // --- 3. 防御側の状態管理 ---
  const [defHpEv, setDefHpEv] = useState(32); 
  const [defEv, setDefEv] = useState(0); 
  const [defNature, setDefNature] = useState(1.0);
  const [defItem, setDefItem] = useState(ITEMS[0]);
  const [defAbility, setDefAbility] = useState("なし");
  const [defRank, setDefRank] = useState(0);

  // --- 4. 環境（天候・フィールド・設置物） ---
  const [weather, setWeather] = useState("none"); 
  const [terrain, setTerrain] = useState("none"); 
  const [isStealthRock, setIsStealthRock] = useState(false);
  const [spikes, setSpikes] = useState(0); 
  const [isPoisoned, setIsPoisoned] = useState(false); 
  const [isBadlyPoisoned, setIsBadlyPoisoned] = useState(false); 

  // ==========================================
  // 🎮 イベントハンドラー（Event Handlers）
  // ==========================================

  const handleAttackerSelect = (p: Pokemon) => {
    setAttacker(p);
    const abilities = getAbilitiesArray(p);
    const initialAbility = isMega(p.name) ? abilities[0] || "メガストーン" : abilities[0] || "なし";
    if (isMega(p.name)) setAtkItem(ITEMS[0]); 
    setAtkAbility(initialAbility);
  };

  const handleDefenderSelect = (p: Pokemon) => {
    setDefender(p);
    const abilities = getAbilitiesArray(p);
    const initialAbility = isMega(p.name) ? abilities[0] || "メガストーン" : abilities[0] || "なし";
    if (isMega(p.name)) setDefItem(ITEMS[0]);
    setDefAbility(initialAbility);
    if (initialAbility === "いかく") setAtkRank((prev) => Math.max(-6, prev - 1));
  };

  const handleSwap = () => {
    setAttacker(defender);
    setDefender(attacker);
    setAtkItem(defItem);
    setDefItem(atkItem);
    setAtkAbility(defAbility);
    setDefAbility(atkAbility);
    setAtkRank(atkAbility === "いかく" ? -1 : 0);
    setDefRank(0); 
    setIsAtkBurned(false);
  };

  // ==========================================
  // 🧮 ダメージ計算コアロジック（Damage Engine）
  // ==========================================

  /**
   * 持ち物データ（Item）を直接使った生存シミュレーション
   */
  const simulateSurvival = (maxHp: number, damage: number, item: Item) => {
    let currentHp = maxHp;
    let hits = 0;
    let hasUsedHealItem = false;

    // 最大10発まで計算
    while (currentHp > 0 && hits < 10) {
      hits++;
      currentHp -= damage;
      if (currentHp <= 0) break;

      if (item.type === "heal") {
        if (item.name === "オボンの実" && !hasUsedHealItem && currentHp <= maxHp / 2) {
          currentHp = Math.min(maxHp, currentHp + Math.floor(maxHp * item.multiplier));
          hasUsedHealItem = true;
        }
        if (item.name === "たべのこし") {
          currentHp = Math.min(maxHp, currentHp + Math.floor(maxHp * item.multiplier));
        }
      }
    }
    return hits;
  };

  /**
   * すべての補正を適用した最終ダメージと確率を計算する
   */
  const calculateResult = () => {
    if (!attacker || !defender || !selectedMove) return null;

    if (selectedMove.category === "変化") {
      return { min: 0, max: 0, hp: 100, effectiveness: 0, ohkoProb: 0, isStatus: true, survival: { minHits: 0, maxHits: 0 } };
    }

    const isPhysical = selectedMove.category === "物理";
    const finalHp = calcStat(defender.hp, defHpEv, 1.0, true);
    const isFullHp = true;

    const atkAbil = RELEVANT_ABILITIES.find((a) => a.name === atkAbility) || { name: "なし", multiplier: 1.0 };
    const defAbil = RELEVANT_ABILITIES.find((a) => a.name === defAbility) || { name: "なし", multiplier: 1.0 };

    // 0. 技の「威力 (Power)」の計算
    let currentPower = selectedMove.power;
    let currentMoveType = selectedMove.type; 

    // ウェザーボールの動的変化
    if (selectedMove.name === "ウェザーボール" && weather !== "none") {
      currentPower = 100; 
      if (weather === "sun") currentMoveType = "ほのお";
      if (weather === "rain") currentMoveType = "みず";
      if (weather === "sand") currentMoveType = "いわ";
      if (weather === "snow") currentMoveType = "こおり";
    }

    const hasFairyAura = atkAbility === "フェアリーオーラ" || defAbility === "フェアリーオーラ";
    const hasAuraBreak = atkAbility === "オーラブレイク" || defAbility === "オーラブレイク";
    if (hasFairyAura && selectedMove.type === "フェアリー") {
      currentPower = Math.floor(currentPower * (hasAuraBreak ? 0.75 : 1.33));
    }

    const isAtkGrounded = attacker.type1 !== "ひこう" && attacker.type2 !== "ひこう" && atkAbility !== "ふゆう";
    if (isAtkGrounded) {
      if (terrain === "electric" && currentMoveType === "でんき") currentPower = Math.floor(currentPower * 1.3);
      else if (terrain === "grassy" && currentMoveType === "くさ") currentPower = Math.floor(currentPower * 1.3);
      else if (terrain === "psychic" && currentMoveType === "エスパー") currentPower = Math.floor(currentPower * 1.3);
    }
    if (terrain === "grassy" && ["じしん", "じならし", "マグニチュード"].includes(selectedMove.name)) {
      currentPower = Math.floor(currentPower * 0.5);
    }

    if (atkAbility === "かたいツメ" && isPhysical) {
      currentPower = Math.floor(currentPower * atkAbil.multiplier);
    }

    // 1. 攻撃力 (A) の計算
    let a = calcStat(isPhysical ? attacker.attack : attacker.spAttack, atkEv, atkNature);
    a = Math.floor(a * RANK_MODIFIERS[atkRank]);
    if (atkAbility === "ちからもち" && isPhysical) a = Math.floor(a * atkAbil.multiplier);
    if (atkItem.type === (isPhysical ? "atk" : "spa")) a = Math.floor(a * atkItem.multiplier);
    if (isAtkBurned && isPhysical) {
      a = atkAbility === "こんじょう" ? Math.floor(a * atkAbil.multiplier) : Math.floor(a * 0.5);
    }

    // 2. 防御力 (D) の計算
    const targetsPhysicalDef = ["サイコショック", "サイコブレイク", "しんぴのつるぎ"].includes(selectedMove.name);
    const usesPhysicalStat = isPhysical || targetsPhysicalDef;

    let d = calcStat(usesPhysicalStat ? defender.defense : defender.spDefense, defEv, defNature);
    d = Math.floor(d * RANK_MODIFIERS[defRank]);
    if (defItem.type === (usesPhysicalStat ? "def" : "spd")) d = Math.floor(d * defItem.multiplier);

    if (weather === "sand" && !usesPhysicalStat && (defender.type1 === "いわ" || defender.type2 === "いわ")) d = Math.floor(d * 1.5);
    if (weather === "snow" && usesPhysicalStat && (defender.type1 === "こおり" || defender.type2 === "こおり")) d = Math.floor(d * 1.5);

    // 3. 基本ダメージ計算
    let baseDamage = Math.floor(Math.floor((Math.floor((2 * 50) / 5 + 2) * currentPower * a) / d) / 50 + 2);

    if (weather === "sun") {
      if (currentMoveType === "ほのお") baseDamage = Math.floor(baseDamage * 1.5);
      if (currentMoveType === "みず") baseDamage = Math.floor(baseDamage * 0.5);
    } else if (weather === "rain") {
      if (currentMoveType === "みず") baseDamage = Math.floor(baseDamage * 1.5);
      if (currentMoveType === "ほのお") baseDamage = Math.floor(baseDamage * 0.5);
    }

    const isDefGrounded = defender.type1 !== "ひこう" && defender.type2 !== "ひこう" && defAbility !== "ふゆう";
    if (terrain === "misty" && currentMoveType === "ドラゴン" && isDefGrounded) {
      baseDamage = Math.floor(baseDamage * 0.5);
    }

    // 4. 乱数展開 ＆ 相性判定
    const stabMod = (currentMoveType === attacker.type1 || currentMoveType === attacker.type2) ? (atkAbility === "てきおうりょく" ? 2.0 : 1.5) : 1.0;

    const getTypeMultiplier = (mType: string, tType: string | null | undefined, abil: string) => {
      if (!tType) return 1.0;
      let m = TYPE_CHART[mType]?.[tType] ?? 1.0;
      if ((abil === "きもったま" || abil === "マインドアイ") && tType === "ゴースト" && (mType === "ノーマル" || mType === "かくとう") && m === 0) return 1.0;
      return m;
    };

    const type1Mod = getTypeMultiplier(currentMoveType, defender.type1, atkAbility);
    const type2Mod = getTypeMultiplier(currentMoveType, defender.type2, atkAbility);
    let effectiveness = type1Mod * type2Mod;

    if (defAbility === "ふゆう" && currentMoveType === "じめん" && atkAbility !== "かたやぶり") effectiveness = 0;
    if (defAbility === "あついしぼう" && (currentMoveType === "ほのお" || currentMoveType === "こおり")) effectiveness = effectiveness * 0.5;

    const damageList = [];
    for (let i = 85; i <= 100; i++) {
      let dmg = Math.floor((baseDamage * i) / 100);
      dmg = Math.floor(dmg * stabMod);
      dmg = Math.floor(dmg * effectiveness);

      if (atkItem.name === "たつじんのおび") {
        if (effectiveness > 1) dmg = Math.floor(dmg * atkItem.multiplier);
      } else if (atkItem.type === "dmg") {
        dmg = Math.floor(dmg * atkItem.multiplier);
      }

      if (defAbility === "マルチスケイル" && isFullHp) dmg = Math.floor(dmg * defAbil.multiplier);
      if (dmg === 0 && effectiveness > 0) dmg = 1;
      damageList.push(dmg);
    }

    const ohkoCount = damageList.filter((d) => d >= finalHp).length;
    const ohkoProb = (ohkoCount / 16) * 100;
    const minHits = simulateSurvival(finalHp, damageList[15], defItem); 
    const maxHits = simulateSurvival(finalHp, damageList[0], defItem);

    return { min: damageList[0], max: damageList[15], hp: finalHp, effectiveness, ohkoProb, isStatus: false, damageList, survival: { minHits, maxHits } };
  };

  const res = calculateResult();

  // ==========================================
  // 📈 UI描画用ヘルパー（UI Helpers）
  // ==========================================

  const getBadgeStyle = (prob: number) => {
    if (prob === 100) return { label: "High Damage", bg: "#fee2e2", text: "#ef4444" };
    if (prob > 0) return { label: "Chance", bg: "#fef3c7", text: "#d97706" };
    return { label: "Safe", bg: "#dcfce7", text: "#16a34a" };
  };

  /**
   * 複雑な乱数・スリップ・回復要素を考慮した最終結果テキストを生成
   */
  const getSurvivalText = (res: any, item: any) => {
    if (!defender) return { text: "", color: "#888" };
    if (res.effectiveness === 0) return { text: "無効", color: "#888" };

    const hp = res.hp;
    const damageList = res.damageList;
    const isRecovery = ["オボンの実", "たべのこし"].includes(item.name);
    const hasMagicGuard = defAbility === "マジックガード";
    const isGrounded = defender.type1 !== "ひこう" && defender.type2 !== "ひこう" && defAbility !== "ふゆう";

    // ① 登場時ダメージ（ステロ・まきびし）
    let entryDamage = 0;
    if (!hasMagicGuard) {
      if (isStealthRock) {
        const rockMod1 = TYPE_CHART["いわ"]?.[defender.type1] ?? 1.0;
        const rockMod2 = defender.type2 ? (TYPE_CHART["いわ"]?.[defender.type2] ?? 1.0) : 1.0;
        entryDamage += Math.floor(hp * (1 / 8) * rockMod1 * rockMod2);
      }
      if (isGrounded && spikes > 0) {
        const spikesRate = spikes === 1 ? (1/8) : spikes === 2 ? (1/6) : (1/4);
        entryDamage += Math.floor(hp * spikesRate);
      }
    }

    // ② ターン終了時ダメージ
    const getTurnEndDamage = (turn: number) => {
      if (hasMagicGuard) return 0;
      let dmg = 0;
      const isSandImmune = ["いわ", "じめん", "はがね"].includes(defender.type1) || ["いわ", "じめん", "はがね"].includes(defender.type2 || "") || ["ぼうじん", "すなかき", "すなのちから", "すながくれ"].includes(defAbility);
      if (weather === "sand" && !isSandImmune) dmg += Math.floor(hp / 16);
      if (isPoisoned) dmg += Math.floor(hp / 8);
      if (isBadlyPoisoned) dmg += Math.floor(hp * turn / 16); 
      return dmg;
    };

    let startHp = hp - entryDamage;
    if (startHp <= 0) return { text: "設置技ダメージで瀕死", color: "#ef4444", sub: "" };

    const calcMaxHits = () => {
      let tempHp = startHp;
      let hasUsedBerry = false;
      let h = 0;
      const minDmg = damageList[0]; 
      while (tempHp > 0 && h < 20) {
        h++;
        tempHp -= minDmg;
        if (tempHp <= 0) return h;
        if (item.name === "オボンの実" && !hasUsedBerry && tempHp <= hp / 2) {
          tempHp = Math.min(hp, tempHp + Math.floor(hp / 4));
          hasUsedBerry = true;
        }
        if (item.name === "たべのこし") tempHp = Math.min(hp, tempHp + Math.floor(hp / 16));
        tempHp -= getTurnEndDamage(h);
      }
      return h;
    };

    const maxHits = calcMaxHits();

    // 確率分布をDPで爆速計算
    let currentStates = new Map<string, number>();
    currentStates.set(`${startHp},0`, 1); 
    let resultProbs = new Array(7).fill(0);
    let totalPatterns = 1;

    for (let h = 1; h <= 6; h++) {
      totalPatterns *= 16;
      let nextStates = new Map<string, number>();
      let killsThisTurn = 0;

      for (const [state, count] of currentStates) {
        const [currentHp, berryUsedStr] = state.split(",").map(Number);
        const berryUsed = berryUsedStr === 1;

        for (const dmg of damageList) {
          let nextHp = currentHp - dmg;
          if (nextHp <= 0) {
            killsThisTurn += count; 
          } else {
            let nextBerryUsed = berryUsed;
            if (item.name === "オボンの実" && !nextBerryUsed && nextHp <= hp / 2) {
              nextHp = Math.min(hp, nextHp + Math.floor(hp / 4));
              nextBerryUsed = true;
            }
            if (item.name === "たべのこし") nextHp = Math.min(hp, nextHp + Math.floor(hp / 16));
            nextHp -= getTurnEndDamage(h);
            if (nextHp <= 0) {
              killsThisTurn += count;
            } else {
              const key = `${nextHp},${nextBerryUsed ? 1 : 0}`;
              nextStates.set(key, (nextStates.get(key) || 0) + count);
            }
          }
        }
      }
      resultProbs[h] = (killsThisTurn / totalPatterns) * 100;
      currentStates = nextStates;
      if (currentStates.size === 0) break; 
    }

    const itemLabel = isRecovery ? `(${item.name}込み)` : "";
    const minHits = resultProbs.findIndex((p, i) => i > 0 && p > 0);
    
    if (minHits === -1) return { text: `確定7発以上`, color: "#6366f1", sub: itemLabel };

    const prob = resultProbs[minHits];
    const diff = maxHits - minHits;
    const maxHitsWarning = diff >= 2 ? ` / 確定${maxHits}発` : "";

    let probText = "";
    if (prob >= 99.9) probText = "100";
    else if (prob >= 0.1) probText = prob.toFixed(1);
    else if (prob >= 0.01) probText = prob.toFixed(2);
    else probText = "<0.01";

    if (prob >= 99.9) return { text: `確定${minHits}発`, color: "#10b981", sub: itemLabel };

    return { text: `乱数${minHits}発 (${probText}%)${maxHitsWarning}`, color: "#8b5cf6", sub: itemLabel };
  };

  // ==========================================
  // 🖥️ レンダリング（Render）
  // ==========================================

  return (
    <main style={{ padding: "20px", minHeight: "100vh", backgroundColor: "#f0f2f5", color: "#333" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>React練習用ダメ計ツール</h1>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        
        {/* =======================
            攻撃側エリア
        ======================= */}
        <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "350px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#ff4d4d", borderBottom: "2px solid" }}>攻撃側</h2>
          <PokemonSearch label="攻撃側" onSelect={handleAttackerSelect} selectedPokemon={attacker} />
          
          {attacker && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "10px", width: "70%" }}>
                <Image src={`/pokemon/${attacker.id}.png`} alt={attacker.name} width={32} height={32} priority style={{ objectFit: "contain", imageRendering: "pixelated" }} />
                <div style={{ position: "absolute", top: "0", right: "-10px", display: "flex", gap: "2px", flexDirection: "column", alignItems: "flex-end" }}>
                  <TypeBadge type={attacker.type1} />
                  {attacker.type2 && <TypeBadge type={attacker.type2} />}
                </div>
              </div>
              
              <p style={{ fontSize: "0.8rem", marginBottom: "5px", fontWeight: "bold" }}>種族値</p>
              <BaseStatsSummary pokemon={attacker} />
              
              <div style={{ marginTop: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.8rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#ff4d4d" }}>{atkEv}pt</span>
                </div>
                <input type="range" min="0" max="32" step="1" value={atkEv} onChange={(e) => setAtkEv(Number(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: "#ff4d4d" }} />
              </div>
              
              <div style={{ textAlign: "left", display: "flex", gap: "8px", alignItems: "center" }}>
                <WheelNumberInput value={atkEv} onChange={setAtkEv} />
                <button onClick={() => setAtkEv(0)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>0</button>
                <button onClick={() => setAtkEv(32)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>32</button>
              </div>

              {(() => {
                const isPhysical = selectedMove?.category === "物理";
                const label = isPhysical ? "こうげき" : "とくこう";
                const baseStat = isPhysical ? attacker.attack : attacker.spAttack;
                const actualStat = calcStat(baseStat, atkEv, atkNature);
                return (
                  <div style={{ padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px", marginBottom: "10px" }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>使用ステータス: {label}</p>
                    <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>種族値: {baseStat} → <span style={{ color: "#af2101", fontWeight: "bold" }}>実数値: {actualStat}</span></p>
                  </div>
                );
              })()} 

              <div style={{ marginTop: "10px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px" }}>性格補正</label>
                <div style={{ display: "flex", gap: "8px", fontSize: "0.8rem", justifyContent: "center" }}>
                  {[{ label: "上昇 (1.1x)", value: 1.1 }, { label: "なし (1.0x)", value: 1.0 }, { label: "下降 (0.9x)", value: 0.9 }].map((opt) => (
                    <label key={opt.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="radio" name="atkNature" value={opt.value} checked={atkNature === opt.value} onChange={(e) => setAtkNature(Number(e.target.value))} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>特性</label>
                  <select style={{ width: "100%", padding: "4px", color: "black", borderRadius: "4px", backgroundColor: isMega(attacker?.name) ? "#e9e9e9" : "#fff", cursor: isMega(attacker?.name) ? "not-allowed" : "pointer" }} value={atkAbility} onChange={(e) => setAtkAbility(e.target.value)} disabled={isMega(attacker?.name)}>
                    {getAbilitiesArray(attacker).map((ab) => (<option key={ab} value={ab}>{ab}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>持ち物</label>
                  <select style={{ width: "100%", padding: "4px", color: "black", borderRadius: "4px", backgroundColor: isMega(attacker?.name) ? "#e9e9e9" : "#fff", cursor: isMega(attacker?.name) ? "not-allowed" : "pointer" }} value={atkItem.name} onChange={(e) => setAtkItem(ITEMS.find((i) => i.name === e.target.value) || ITEMS[0])} disabled={isMega(attacker?.name)}>
                    {isMega(attacker?.name) ? <option value="なし">メガストーン固定</option> : ITEMS.map((item) => (<option key={item.name} value={item.name}>{item.name}</option>))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>ランク</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden" }}>
                  <button onClick={() => setAtkRank((prev) => Math.max(-6, prev - 1))} style={{ width: "30px", height: "30px", backgroundColor: "#f0f0f0", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#333" }}>−</button>
                  <input type="number" min="-6" max="6" value={atkRank} onChange={(e) => setAtkRank(Number(e.target.value))} style={{ width: "40px", height: "30px", textAlign: "center", border: "none", borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc", color: "black", margin: 0, outline: "none" }} />
                  <button onClick={() => setAtkRank((prev) => Math.min(6, prev + 1))} style={{ width: "30px", height: "30px", backgroundColor: "#f0f0f0", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#333" }}>＋</button>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => setAtkRank((prev) => Math.max(-6, prev - 2))} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>-2</button>
                  <button onClick={() => setAtkRank(0)} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>0</button>
                  <button onClick={() => setAtkRank((prev) => Math.min(6, prev + 2))} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>+2</button>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#ff4d4d", fontWeight: "bold", marginLeft: "auto" }}>({RANK_MODIFIERS[atkRank]}x)</span>
              </div>

              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", cursor: "pointer", color: isAtkBurned ? "#d32f2f" : "#333", fontWeight: isAtkBurned ? "bold" : "normal" }}>
                  <input type="checkbox" checked={isAtkBurned} onChange={(e) => setIsAtkBurned(e.target.checked)} style={{ marginRight: "6px", accentColor: "#d32f2f", width: "16px", height: "16px", cursor: "pointer" }} />
                  やけど状態
                </label>
                {isAtkBurned && atkAbility === "こんじょう" && (
                  <span style={{ marginLeft: "10px", fontSize: "0.7rem", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>こんじょう発動(1.5x)</span>
                )}
              </div>

              <div style={{ marginTop: "15px" }}>
                <MoveSearch onSelect={setSelectedMove} selectedPokemonId={attacker?.id} />
                {selectedMove && (
                  <div onMouseEnter={() => setIsMoveHovered(true)} onMouseLeave={() => setIsMoveHovered(false)} style={{ marginTop: "10px", padding: "12px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd", borderLeft: `6px solid ${selectedMove.category === "物理" ? "#ff4d4d" : selectedMove.category === "特殊" ? "#4d79ff" : "#888"}`, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{selectedMove.name}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: "bold", color: "#333", marginRight: "10px" }}>威力: {selectedMove.power && selectedMove.power > 0 ? selectedMove.power : "—"}</span>
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>命中: {selectedMove.accuracy ? selectedMove.accuracy : "—"}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "#666", display: "flex", gap: "10px" }}>
                      <span>タイプ: {selectedMove.type}</span>
                      <span>分類: {selectedMove.category}</span>
                      {(selectedMove.type === attacker.type1 || selectedMove.type === attacker.type2) && (
                        <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: atkAbility === "てきおうりょく" ? "#d32f2f" : "#e67e22", backgroundColor: atkAbility === "てきおうりょく" ? "#ffebee" : "#fef5e7", border: `1px solid ${atkAbility === "てきおうりょく" ? "#ffcdd2" : "#fad7a0"}`, padding: "2px 5px", borderRadius: "4px", fontWeight: atkAbility === "てきおうりょく" ? "bold" : "normal" }}>
                          タイプ一致({atkAbility === "てきおうりょく" ? "2.0x" : "1.5x"})
                        </span>
                      )}
                    </div>
                    {isMoveHovered && selectedMove.effect && (
                      <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px", backgroundColor: "rgba(0, 0, 0, 0.85)", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "0.75rem", width: "max-content", maxWidth: "280px", zIndex: 100, pointerEvents: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.3)", lineHeight: "1.4", textAlign: "left" }}>
                        <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "6px", borderStyle: "solid", borderColor: "transparent transparent rgba(0, 0, 0, 0.85) transparent" }} />
                        {selectedMove.effect}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* =======================
            中央エリア（環境・入替）
        ======================= */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", width: "10%" }}>
          <button onClick={handleSwap} title="攻撃と防御を入れ替える" style={{ backgroundColor: "#fff", border: "2px solid #ddd", borderRadius: "50%", width: "50px", height: "50px", fontSize: "1.5rem", fontWeight: "bold", color: "#666", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.color = "#333"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.color = "#666"; }}>⇄</button>
          
          <div style={{ width: "100%", backgroundColor: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "5px" }}>☀️ 天候</span>
              <div style={{ display: "flex", gap: "5px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                {[{ label: "なし", value: "none" }, { label: "晴れ", value: "sun" }, { label: "雨", value: "rain" }, { label: "砂嵐", value: "sand" }, { label: "雪", value: "snow" }].map((w) => (
                  <label key={w.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input type="radio" name="weather" value={w.value} checked={weather === w.value} onChange={(e) => setWeather(e.target.value)} />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "5px" }}>🌱 フィールド</span>
              <div style={{ display: "flex", gap: "5px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                {[{ label: "なし", value: "none" }, { label: "エレキ", value: "electric" }, { label: "グラス", value: "grassy" }, { label: "ミスト", value: "misty" }, { label: "サイコ", value: "psychic" }].map((t) => (
                  <label key={t.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input type="radio" name="terrain" value={t.value} checked={terrain === t.value} onChange={(e) => setTerrain(e.target.value)} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "5px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>🪨 設置技・状態異常</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <input type="checkbox" checked={isStealthRock} onChange={(e) => setIsStealthRock(e.target.checked)} />
                  ステルスロック
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ color: "#555" }}>まきびし:</span>
                  {[0, 1, 2, 3].map((num) => (
                    <label key={`spikes-${num}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                      <input type="radio" name="spikes" value={num} checked={spikes === num} onChange={() => setSpikes(num)} />
                      {num}回
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ color: "#555" }}>毒状態:</span>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input type="radio" name="poison" checked={!isPoisoned && !isBadlyPoisoned} onChange={() => { setIsPoisoned(false); setIsBadlyPoisoned(false); }} /> なし
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input type="radio" name="poison" checked={isPoisoned} onChange={() => { setIsPoisoned(true); setIsBadlyPoisoned(false); }} /> 毒
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input type="radio" name="poison" checked={isBadlyPoisoned} onChange={() => { setIsPoisoned(false); setIsBadlyPoisoned(true); }} /> 猛毒
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            防御側エリア
        ======================= */}
        <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "350px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#4d79ff", borderBottom: "2px solid" }}>防御側</h2>
          <PokemonSearch label="防御側" onSelect={handleDefenderSelect} selectedPokemon={defender} />
          
          {defender && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "10px", width: "70%" }}>
                <Image src={`/pokemon/${defender.id}.png`} alt={defender.name} width={32} height={32} priority style={{ objectFit: "contain", imageRendering: "pixelated" }} />
                <div style={{ position: "absolute", top: "0", right: "-10px", display: "flex", gap: "2px", flexDirection: "column", alignItems: "flex-end" }}>
                  <TypeBadge type={defender.type1} />
                  {defender.type2 && <TypeBadge type={defender.type2} />}
                </div>
              </div>
              
              <p style={{ fontSize: "0.8rem", marginBottom: "5px", fontWeight: "bold" }}>種族値</p>
              <BaseStatsSummary pokemon={defender} />
              
              <label style={{ display: "block", fontSize: "0.9rem" }}>HP 努力値</label>
              <div style={{ marginTop: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.9rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#163488" }}>{defHpEv}pt</span>
                </div>
                <input type="range" min="0" max="32" step="1" value={defHpEv} onChange={(e) => setDefHpEv(Number(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: "#163488" }} />
              </div>
              
              <div style={{ textAlign: "left", display: "flex", gap: "8px", alignItems: "center" }}>
                <WheelNumberInput value={defHpEv} onChange={setDefHpEv} />
                <button onClick={() => setDefHpEv(0)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>0</button>
                <button onClick={() => setDefHpEv(32)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>32</button>
              </div>
              
              <div style={{ padding: "8px", backgroundColor: "#f0f5ff", borderRadius: "5px", marginBottom: "10px" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>HP</p>
                <p style={{ margin: "2px 0", fontSize: "0.9rem" }}>種族値: {defender.hp} → <span style={{ fontWeight: "bold" }}>実数値: {calcStat(defender.hp, defHpEv, 1.0, true)}</span></p>
              </div>

              <label style={{ display: "block", fontSize: "0.9rem", paddingTop: "15px", marginTop: "20px", borderTop: "1px solid #ccc" }}>防御側の耐久努力値</label>
              <div style={{ marginTop: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.8rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#163488" }}>{defEv}pt</span>
                </div>
                <input type="range" min="0" max="32" step="1" value={defEv} onChange={(e) => setDefEv(Number(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: "#163488" }} />
              </div>
              
              <div style={{ textAlign: "left", display: "flex", gap: "8px", alignItems: "center" }}>
                <WheelNumberInput value={defEv} onChange={setDefEv} />
                <button onClick={() => setDefEv(0)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>0</button>
                <button onClick={() => setDefEv(32)} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>32</button>
              </div>

              {(() => {
                const isPhysical = selectedMove?.category === "物理";
                const label = isPhysical ? "ぼうぎょ" : "とくぼう";
                const baseStat = isPhysical ? defender.defense : defender.spDefense;
                const actualStat = calcStat(baseStat, defEv, defNature);
                return (
                  <div style={{ marginTop: "15px", padding: "8px", backgroundColor: "#f0f5ff", borderRadius: "5px" }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}>種族値: {baseStat} → <span style={{ fontWeight: "bold" }}>実数値: {actualStat}</span></p>
                  </div>
                );
              })()}

              <div style={{ marginTop: "10px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px" }}>性格補正</label>
                <div style={{ display: "flex", gap: "8px", fontSize: "0.8rem", justifyContent: "center" }}>
                  {[{ label: "上昇 (1.1x)", value: 1.1 }, { label: "なし (1.0x)", value: 1.0 }, { label: "下降 (0.9x)", value: 0.9 }].map((opt) => (
                    <label key={opt.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="radio" name="defNature" value={opt.value} checked={defNature === opt.value} onChange={(e) => setDefNature(Number(e.target.value))} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>特性</label>
                  <select style={{ width: "100%", padding: "4px", color: "black", borderRadius: "4px", backgroundColor: isMega(defender?.name) ? "#e9e9e9" : "#fff", cursor: isMega(defender?.name) ? "not-allowed" : "pointer" }} value={defAbility} onChange={(e) => { setDefAbility(e.target.value); if (e.target.value === "いかく") setAtkRank((prev) => Math.max(-6, prev - 1)); }} disabled={isMega(defender?.name)}>
                    {getAbilitiesArray(defender).map((ab) => (<option key={ab} value={ab}>{ab}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>持ち物</label>
                  <select style={{ width: "100%", padding: "4px", color: "black", borderRadius: "4px", backgroundColor: isMega(defender?.name) ? "#e9e9e9" : "#fff", cursor: isMega(defender?.name) ? "not-allowed" : "pointer" }} value={defItem.name} onChange={(e) => setDefItem(ITEMS.find((i) => i.name === e.target.value) || ITEMS[0])} disabled={isMega(defender?.name)}>
                    {isMega(defender?.name) ? <option value="なし">メガストーン固定</option> : ITEMS.map((item) => (<option key={item.name} value={item.name}>{item.name}</option>))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>ランク</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden" }}>
                  <button onClick={() => setDefRank((prev) => Math.max(-6, prev - 1))} style={{ width: "30px", height: "30px", backgroundColor: "#f0f0f0", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#333" }}>−</button>
                  <input type="number" min="-6" max="6" value={defRank} onChange={(e) => setDefRank(Number(e.target.value))} style={{ width: "40px", height: "30px", textAlign: "center", border: "none", borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc", color: "black", margin: 0, outline: "none" }} />
                  <button onClick={() => setDefRank((prev) => Math.min(6, prev + 1))} style={{ width: "30px", height: "30px", backgroundColor: "#f0f0f0", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#333" }}>＋</button>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => setDefRank((prev) => Math.max(-6, prev - 2))} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>-2</button>
                  <button onClick={() => setDefRank(0)} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>0</button>
                  <button onClick={() => setDefRank((prev) => Math.min(6, prev + 2))} style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff", cursor: "pointer", color: "#333" }}>+2</button>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#4d79ff", fontWeight: "bold", marginLeft: "auto" }}>({RANK_MODIFIERS[defRank]}x)</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =======================
          計算結果表示エリア
      ======================= */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "30px", backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "600px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #eaeaea" }}>
          {!res ? (
            <p style={{ textAlign: "center", color: "#999" }}>ポケモンと技を選択してダメージを測定</p>
          ) : res.isStatus ? (
            <h2 style={{ textAlign: "center", color: "#888" }}>変化技（ダメージなし）</h2>
          ) : (
            <>
              {(() => {
                const badge = getBadgeStyle(res.ohkoProb);
                return (
                  <div style={{ textAlign: "center", marginBottom: "15px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                  </div>
                );
              })()}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0" }}>ダメージ範囲</p>
                <h2 style={{ fontSize: "3rem", fontWeight: "900", margin: "5px 0", color: "#1a1a1a" }}>{res.effectiveness === 0 ? "0" : `${Math.max(1, res.min)} 〜 ${Math.max(1, res.max)}`}</h2>
                <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#666" }}>（{((res.min / res.hp) * 100).toFixed(1)}% 〜 {((res.max / res.hp) * 100).toFixed(1)}%）</p>
              </div>
            {/* 3. HPバー */}

                  {res.effectiveness > 0 && <DamageBar hp={res.hp} minDam={res.min} maxDam={res.max} />}
                {/* 4. 確定数エリア */} 
                {(() => {
                const survival = getSurvivalText(res, defItem);
                return (
                  <div style={{ textAlign: "center", padding: "15px", borderRadius: "12px", backgroundColor: "#f8fafc", marginTop: "10px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: survival.color }}>
                      {survival.text}
                      {survival.sub && <span style={{ fontSize: "0.8rem", display: "block", color: "#666" }}>{survival.sub}</span>}
                    </div>
                    <p style={{ margin: "5px 0 0", fontSize: "0.9rem", color: "#888" }}>相性倍率: {res.effectiveness}x</p>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </main>
  );
}