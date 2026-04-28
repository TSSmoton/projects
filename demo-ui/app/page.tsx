"use client";

// import { useState } from "react";
import { useState, useRef, useEffect } from "react";
import PokemonSearch from "../src/components/PokemonSearch";
import MoveSearch from "../src/components/MoveSearch";
import Image from "next/image";

// ポケモンの型定義
interface Pokemon {
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
  weight?: number; // 体重依存技（くさむすび等）のために一応持っておく
}

// 技の型定義
interface Move {
  id: number;
  name: string;
  type: string;
  category: "物理" | "特殊" | "変化"; // 決まった文字列のみ許可
  power: number;
  isContact?: boolean;   // 接触技フラグ（かたいツメ用）
  targetStat?: "def";    // 特殊だけど防御参照（サイコショック・サイコブレイク用）
  minHits?: number;      // 連続技の最小回数
  maxHits?: number;      // 連続技の最大回数
  isWaterPowerUp?: boolean; // すいほうなどの補正用
}

interface Item {
  name: string;
  multiplier: number;
  type: "atk" | "dmg" | "speed" | "spa" | "spd" | "none" | "heal"; // 攻撃力にかかるか、最終ダメージにかかるか
}

// タイプ相性表
const TYPE_CHART: Record<string, Record<string, number>> = {
  ノーマル: { いわ: 0.5, ゴースト: 0, はがね: 0.5 },
  ほのお: {
    ほのお: 0.5,
    みず: 0.5,
    くさ: 2,
    こおり: 2,
    むし: 2,
    いわ: 0.5,
    ドラゴン: 0.5,
    はがね: 2,
  },
  みず: { ほのお: 2, みず: 0.5, くさ: 0.5, じめん: 2, いわ: 2, ドラゴン: 0.5 },
  でんき: {
    みず: 2,
    でんき: 0.5,
    くさ: 0.5,
    じめん: 0,
    ひこう: 2,
    ドラゴン: 0.5,
  },
  くさ: {
    ほのお: 0.5,
    みず: 2,
    くさ: 0.5,
    どく: 0.5,
    じめん: 2,
    ひこう: 0.5,
    むし: 0.5,
    いわ: 2,
    ドラゴン: 0.5,
    はがね: 0.5,
  },
  こおり: {
    ほのお: 0.5,
    みず: 0.5,
    くさ: 2,
    こおり: 0.5,
    じめん: 2,
    ひこう: 2,
    ドラゴン: 2,
    はがね: 0.5,
  },
  かくとう: {
    ノーマル: 2,
    こおり: 2,
    どく: 0.5,
    ひこう: 0.5,
    エスパー: 0.5,
    むし: 0.5,
    いわ: 2,
    ゴースト: 0,
    あく: 2,
    はがね: 2,
    フェアリー: 0.5,
  },
  どく: {
    くさ: 2,
    どく: 0.5,
    じめん: 0.5,
    いわ: 0.5,
    ゴースト: 0.5,
    はがね: 0,
    フェアリー: 2,
  },
  じめん: {
    ほのお: 2,
    でんき: 2,
    くさ: 0.5,
    どく: 2,
    ひこう: 0,
    むし: 0.5,
    いわ: 2,
    はがね: 2,
  },
  ひこう: {
    でんき: 0.5,
    くさ: 2,
    かくとう: 2,
    むし: 2,
    いわ: 0.5,
    はがね: 0.5,
  },
  エスパー: { かくとう: 2, どく: 2, エスパー: 0.5, あく: 0, はがね: 0.5 },
  むし: {
    ほのお: 0.5,
    くさ: 2,
    かくとう: 0.5,
    どく: 0.5,
    ひこう: 0.5,
    エスパー: 2,
    ゴースト: 0.5,
    あく: 2,
    はがね: 0.5,
    フェアリー: 0.5,
  },
  いわ: {
    ほのお: 2,
    こおり: 2,
    かくとう: 0.5,
    じめん: 0.5,
    ひこう: 2,
    むし: 2,
    はがね: 0.5,
  },
  ゴースト: { ノーマル: 0, エスパー: 2, ゴースト: 2, あく: 0.5 },
  ドラゴン: { ドラゴン: 2, はがね: 0.5, フェアリー: 0 },
  あく: { かくとう: 0.5, エスパー: 2, ゴースト: 2, あく: 0.5, フェアリー: 0.5 },
  はがね: {
    ほのお: 0.5,
    みず: 0.5,
    でんき: 0.5,
    こおり: 2,
    いわ: 2,
    はがね: 0.5,
    フェアリー: 2,
  },
  フェアリー: {
    ほのお: 0.5,
    かくとう: 2,
    どく: 0.5,
    ドラゴン: 2,
    あく: 2,
    はがね: 0.5,
  },
};
//ステータス一覧コンポーネント
const BaseStatsSummary = ({ pokemon }: { pokemon: Pokemon }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "4px",
      fontSize: "0.75rem",
      backgroundColor: "#eee",
      padding: "8px",
      borderRadius: "5px",
      marginBottom: "10px",
    }}
  >
    <div style={{ textAlign: "center" }}>HP: {pokemon.hp}</div>
    <div style={{ textAlign: "center" }}>こうげき: {pokemon.attack}</div>
    <div style={{ textAlign: "center" }}>ぼうぎょ: {pokemon.defense}</div>
    <div style={{ textAlign: "center" }}>とくこう: {pokemon.spAttack}</div>
    <div style={{ textAlign: "center" }}>とくぼう: {pokemon.spDefense}</div>
    <div style={{ textAlign: "center" }}>すばやさ: {pokemon.speed}</div>
  </div>
);
// 絶対に画面をスクロールさせない数値入力コンポーネント
const WheelNumberInput = ({
  value,
  onChange,
  min = 0,
  max = 32,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const elem = inputRef.current;
    if (!elem) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // passive: false のおかげで確実にスクロールが止まる
      const step = e.deltaY < 0 ? 1 : -1;
      onChange(Math.min(max, Math.max(min, value + step)));
    };

    // passive: false を指定してネイティブのイベントリスナーを登録
    elem.addEventListener("wheel", handleWheel, { passive: false });
    return () => elem.removeEventListener("wheel", handleWheel);
  }, [value, onChange, min, max]);

  return (
    <input
      ref={inputRef}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "60px", color: "black" }}
    />
  );
};

// ダメージバーコンポーネント
const DamageBar = ({
  hp,
  minDam,
  maxDam,
}: {
  hp: number;
  minDam: number;
  maxDam: number;
}) => {
  // パーセント計算
  const minPercent = Math.min(100, (minDam / hp) * 100);
  const maxPercent = Math.min(100, (maxDam / hp) * 100);
  const remainingPercent = Math.max(0, 100 - maxPercent);

  return (
    <div style={{ marginTop: "15px", marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          marginBottom: "4px",
          color: "#666",
        }}
      >
        <span>HPバー</span>
        <span>
          {Math.max(0, hp - maxDam)} / {hp}
        </span>
      </div>
      {/* バー本体 */}
      <div
        style={{
          height: "14px",
          width: "100%",
          backgroundColor: "#e0e0e0", // 背景（空の部分）
          borderRadius: "7px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {/* 残りHP（緑） */}
        <div
          style={{
            width: `${remainingPercent}%`,
            height: "100%",
            backgroundColor:
              remainingPercent > 50
                ? "#4ade80"
                : remainingPercent > 20
                  ? "#fbbf24"
                  : "#ef4444",
            transition: "width 0.3s ease-out",
          }}
        />
        {/* ダメージの振れ幅（赤〜オレンジのグラデーション） */}
        <div
          style={{
            position: "absolute",
            left: `${remainingPercent}%`,
            top: 0,
            width: `${maxPercent - minPercent}%`,
            height: "100%",
            backgroundColor: "#f97316", // オレンジ
            opacity: 0.8,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${remainingPercent + (maxPercent - minPercent)}%`,
            top: 0,
            width: `${minPercent}%`,
            height: "100%",
            backgroundColor: "#555555", // 赤
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
};

// 持ち物の選択肢と倍率
const ITEMS: Item[] = [
  { name: "なし", multiplier: 1.0, type: "none" },
  { name: "命の珠", multiplier: 1.3, type: "dmg" },
  { name: "こだわりハチマキ", multiplier: 1.5, type: "atk" },
  { name: "こだわりメガネ", multiplier: 1.5, type: "spa" },
  { name: "ちからのハチマキ", multiplier: 1.1, type: "dmg" },
  { name: "タイプ強化アイテム", multiplier: 1.2, type: "dmg" },
  { name: "たつじんのおび", multiplier: 1.2, type: "dmg" },
  { name: "とつげきチョッキ", multiplier: 1.5, type: "spd" },
  { name: "オボンの実", multiplier: 0.25, type: "heal" }, // HPバー連動用
  { name: "メガストーン", multiplier: 1, type: "none" }, // 表示用
  { name: "たべのこし", multiplier: 0.0625, type: "heal" }, // 表示用
];
// 計算に影響する特性リスト（代表的なもの）
const RELEVANT_ABILITIES = [
  // { name: "なし", multiplier: 1.0 },
  { name: "てきおうりょく", multiplier: 2.0 }, // タイプ一致が2倍に(技側で計算)
  { name: "ちからもち", multiplier: 2.0 }, // 攻撃2倍
  { name: "かたいツメ", multiplier: 1.3 }, // 直接攻撃1.3倍
  { name: "マルチスケイル", multiplier: 0.5 }, // ダメージ半減
  { name: "いかく", multiplier: 1.0 },
  { name: "こんじょう", multiplier: 1.5 }, //（状態異常で攻撃1.5倍）
];

// ランク補正の倍率表（-6〜+6）
const RANK_MODIFIERS: Record<number, number> = {
  "-6": 2 / 8,
  "-5": 2 / 7,
  "-4": 2 / 6,
  "-3": 2 / 5,
  "-2": 2 / 4,
  "-1": 2 / 3,
  "0": 1.0,
  "1": 1.5,
  "2": 2.0,
  "3": 2.5,
  "4": 3.0,
  "5": 3.5,
  "6": 4.0,
};
// app/page.tsx (Homeコンポーネントの外)

// タイプごとの色定義（原作準拠）
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ノーマル: { bg: "#A8A878", text: "#fff" },
  ほのお: { bg: "#F08030", text: "#fff" },
  みず: { bg: "#6890F0", text: "#fff" },
  でんき: { bg: "#F8D030", text: "#333" }, // 電気は文字を少し暗く
  くさ: { bg: "#78C850", text: "#fff" },
  こおり: { bg: "#98D8D8", text: "#333" }, // 氷も文字を少し暗く
  かくとう: { bg: "#C03028", text: "#fff" },
  どく: { bg: "#A040A0", text: "#fff" },
  じめん: { bg: "#E0C068", text: "#333" }, // 地面も文字を少し暗く
  ひこう: { bg: "#A890F0", text: "#fff" },
  エスパー: { bg: "#F85888", text: "#fff" },
  むし: { bg: "#A8B820", text: "#fff" },
  いわ: { bg: "#B8A038", text: "#fff" },
  ゴースト: { bg: "#705898", text: "#fff" },
  ドラゴン: { bg: "#4538f8", text: "#fff" },
  あく: { bg: "#705848", text: "#fff" },
  はがね: { bg: "#B8B8D0", text: "#333" }, // 鋼も文字を少し暗く
  フェアリー: { bg: "#EE99AC", text: "#fff" },
};

// タイプアイコンコンポーネント
const TypeBadge = ({ type }: { type: string }) => {
  const colors = TYPE_COLORS[type] || { bg: "#666", text: "#fff" }; // 未定義タイプへのフォールバック
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 5px",
        borderRadius: "6px", // 丸みを持たせる
        fontSize: "0.5rem",
        fontWeight: "bold",
        backgroundColor: colors.bg,
        color: colors.text,
        textShadow:
          colors.text === "#fff" ? "0 1px 1px rgba(0,0,0,0.5)" : "none", // 白文字の場合影をつけて視認性向上
        marginLeft: "4px", // 2つのタイプがある場合の隙間
        border: "1px solid rgba(0,0,0,0.2)", // 少し立体感を出す
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)", // 少し影をつける
      }}
    >
      {type}
    </span>
  );
};

// メガシンカ判定
const isMega = (name: string | undefined): boolean => {
  if (!name) return false;
  return (
    name.startsWith("メガ") && !["メガニウム", "メガヤンマ"].includes(name)
  );
};

// ✅ ポケモンの3つの特性カラムを、1つの配列にまとめる便利関数
const getAbilitiesArray = (p: Pokemon | null): string[] => {
  if (!p) return ["なし"];
  // null や undefined を除外して配列化する（例：["さめはだ", "すながくれ"]）
  return [p.ability1, p.ability2, p.hiddenAbility].filter(Boolean) as string[];
};


export default function Home() {
  const [attacker, setAttacker] = useState<Pokemon | null>(null);
  const [defender, setDefender] = useState<Pokemon | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  // --- Homeコンポーネント内：努力値の管理を 0〜32 の範囲に変更 ---
  const [atkEv, setAtkEv] = useState(32); // 攻撃側：最大(32)で初期化
  const [atkNature, setAtkNature] = useState(1.1);

  const [defHpEv, setDefHpEv] = useState(32); // 防御側HP：最大(32)で初期化
  const [defEv, setDefEv] = useState(0); // 防御側耐久：0で初期化
  const [defNature, setDefNature] = useState(1.0);
  // 持ち物のState（初期値は「なし」）
  const [atkItem, setAtkItem] = useState(ITEMS[0]);
  const [defItem, setDefItem] = useState(ITEMS[0]);

  // 特性のState（初期値は「なし」）
  const [atkAbility, setAtkAbility] = useState("なし");
  const [defAbility, setDefAbility] = useState("なし");

  // 天候とフィールド のState（初期値は「なし」）
  const [weather, setWeather] = useState("none"); // none, sun, rain, sand, snow
  const [terrain, setTerrain] = useState("none"); // none, electric, grassy, misty, psychic

  // ステルスロック・まきびしの有無
  const [isStealthRock, setIsStealthRock] = useState(false);
const [spikes, setSpikes] = useState(0); // まきびし (0〜3)
  const [isPoisoned, setIsPoisoned] = useState(false); // どくびし1回 (通常の毒)
  const [isBadlyPoisoned, setIsBadlyPoisoned] = useState(false); // どくびし2回 (猛毒/どくどく)

  // ランク補正のState（-6 〜 +6）
  const [atkRank, setAtkRank] = useState(0);
  const [defRank, setDefRank] = useState(0);
  // 攻撃側のやけど状態
  const [isAtkBurned, setIsAtkBurned] = useState(false);
  /**
   * 新システム対応：ステータス実数値計算
   * @param evLevel 0〜32の努力レベル
   */
  const calcStat = (
    base: number,
    evLevel: number,
    nature: number,
    isHp = false,
  ) => {
    const iv = 31; // 個体値固定
    const level = 50; // レベル50固定

    // 努力レベルを計算用に変換（32段階を旧システム相当の重みに調整）
    const evBonus = evLevel * 2;

    if (isHp) {
      // HPの計算式
      return Math.floor(((base * 2 + iv + evBonus) * level) / 100) + level + 10;
    }
    // 攻撃・防御などの計算式
    return Math.floor(
      (Math.floor(((base * 2 + iv + evBonus) * level) / 100) + 5) * nature,
    );
  };

  // ✅ 攻撃側のポケモンを選んだ時の処理
  const handleAttackerSelect = (p: Pokemon) => {
    setAttacker(p);
    const abilities = getAbilitiesArray(p);
    // セットする特性を一旦変数に入れる
    const initialAbility = isMega(p.name)
      ? abilities[0] || "メガストーン"
      : abilities[0] || "なし";

    if (isMega(p.name)) {
      setAtkItem(ITEMS[0]); // 持ち物「なし」に強制
    }
    setAtkAbility(initialAbility);
  };

  // ✅ 防御側のポケモンを選んだ時の処理
  const handleDefenderSelect = (p: Pokemon) => {
    setDefender(p);
    const abilities = getAbilitiesArray(p);
    // セットする特性を一旦変数に入れる
    const initialAbility = isMega(p.name)
      ? abilities[0] || "メガストーン"
      : abilities[0] || "なし";

    if (isMega(p.name)) {
      setDefItem(ITEMS[0]);
    }
    setDefAbility(initialAbility);

    // 防御側が「いかく」を持って場に出たなら、攻撃側のランクを下げる
    if (initialAbility === "いかく") {
      setAtkRank((prev) => Math.max(-6, prev - 1));
    }
  };



  
  /**
 * 持ち物データ（Item）を直接使った生存シミュレーション
 */
const simulateSurvival = (maxHp: number, damage: number, item: Item) => {
  let currentHp = maxHp;
  let hits = 0;
  let hasUsedHealItem = false;

  // 最大10発まで計算（それ以上は実質無限）
  while (currentHp > 0 && hits < 10) {
    hits++;
    currentHp -= damage;

    if (currentHp <= 0) break;

    // 💡 type: "heal" の持ち物を汎用的に処理
    if (item.type === "heal") {
      // 1. オボンの実（HP半分以下で発動、1回きり）
      if (item.name === "オボンの実" && !hasUsedHealItem && currentHp <= maxHp / 2) {
        currentHp = Math.min(maxHp, currentHp + Math.floor(maxHp * item.multiplier));
        hasUsedHealItem = true;
      }
      
      // 2. たべのこし（毎ターン終了時に継続回復）
      if (item.name === "たべのこし") {
        currentHp = Math.min(maxHp, currentHp + Math.floor(maxHp * item.multiplier));
      }
    }
  }
  return hits;
};

  
  
  
  
  // --- ダメージ計算ロジック ---

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
    let currentMoveType = selectedMove.type; // 👈 今後はこれを使います

    // 💡 ウェザーボールの動的変化
    if (selectedMove.name === "ウェザーボール" && weather !== "none") {
      currentPower = 100; // 天候があれば威力2倍
      if (weather === "sun") currentMoveType = "ほのお";
      if (weather === "rain") currentMoveType = "みず";
      if (weather === "sand") currentMoveType = "いわ";
      if (weather === "snow") currentMoveType = "こおり";
    }
  
  
    const hasFairyAura = atkAbility === "フェアリーオーラ" || defAbility === "フェアリーオーラ";
    const hasAuraBreak = atkAbility === "オーラブレイク" || defAbility === "オーラブレイク";
    if (hasFairyAura && selectedMove.type === "フェアリー") {
      const auraMultiplier = hasAuraBreak ? 0.75 : 1.33;
      currentPower = Math.floor(currentPower * auraMultiplier);
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
    const stabMod = (currentMoveType === attacker.type1 || currentMoveType === attacker.type2)
        ? (atkAbility === "てきおうりょく" ? 2.0 : 1.5) : 1.0;

    const getTypeMultiplier = (mType: string, tType: string | null, abil: string) => {
      if (!tType) return 1.0;
      let m = TYPE_CHART[mType]?.[tType] ?? 1.0;
      if ((abil === "きもったま" || abil === "マインドアイ") && tType === "ゴースト" && (mType === "ノーマル" || mType === "かくとう") && m === 0) return 1.0;
      return m;
    };

    const type1Mod = getTypeMultiplier(currentMoveType, defender.type1, atkAbility);
    const type2Mod = getTypeMultiplier(currentMoveType, defender.type2, atkAbility);
    let effectiveness = type1Mod * type2Mod;

    if (defAbility === "ふゆう" && currentMoveType === "じめん" && atkAbility !== "かたやぶり") effectiveness = 0;

    const damageList = [];
    for (let i = 85; i <= 100; i++) {
      let dmg = Math.floor((baseDamage * i) / 100);
      dmg = Math.floor(dmg * stabMod);
      dmg = Math.floor(dmg * effectiveness);

      // ★アイテム補正：たつじんのおびを「抜群のみ」に限定
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

    // 💡 回復込みの確定数シミュレーションを実行
    const minHits = simulateSurvival(finalHp, damageList[15], defItem); 
    const maxHits = simulateSurvival(finalHp, damageList[0], defItem);

    return {
      min: damageList[0], max: damageList[15], hp: finalHp,
      effectiveness, ohkoProb, isStatus: false,
      damageList,
      survival: { minHits, maxHits }
    };
  };



  // 計算結果を変数に格納（nullの可能性もあるので注意）
  const res = calculateResult();
  // ✅ 攻撃側と防御側をそっくり入れ替える関数
  const handleSwap = () => {
    // 1. ポケモン本体・持ち物・特性を入れ替え
    setAttacker(defender);
    setDefender(attacker);
    setAtkItem(defItem);
    setDefItem(atkItem);
    setAtkAbility(defAbility);
    setDefAbility(atkAbility);

    // 2. ランクのリセットと「いかく」の自動発動
    // 新しい防御側（元の atkAbility）が「いかく」なら、新しい攻撃側のランクを -1
    if (atkAbility === "いかく") {
      setAtkRank(-1);
    } else {
      setAtkRank(0); // いかく以外なら 0 にリセット
    }
    setDefRank(0); // 防御側のランクは常にリセット

    // やけど状態はリセット
    setIsAtkBurned(false);
  };

// バッジの色とテキストを判定する関数
const getBadgeStyle = (prob: number) => {
  if (prob === 100) return { label: "High Damage", bg: "#fee2e2", text: "#ef4444" };
  if (prob > 0) return { label: "Chance", bg: "#fef3c7", text: "#d97706" };
  return { label: "Safe", bg: "#dcfce7", text: "#16a34a" };
};


const getSurvivalText = (res: any, item: any) => {
  if (res.effectiveness === 0) return { text: "無効", color: "#888" };

  const hp = res.hp;
  const damageList = res.damageList;
  const isRecovery = ["オボンの実", "たべのこし"].includes(item.name);

  // ==========================================
  // 💀 A. 定数ダメージの事前計算
  // ==========================================
  const hasMagicGuard = defAbility === "マジックガード";
  const isGrounded = defender.type1 !== "ひこう" && defender.type2 !== "ひこう" && defAbility !== "ふゆう";

  // ① 登場時ダメージ（ステロ・まきびし）
  let entryDamage = 0;
  if (!hasMagicGuard) {
    if (isStealthRock) {
      const rockMod1 = TYPE_CHART["いわ"]?.[defender.type1] ?? 1.0;
      const rockMod2 = TYPE_CHART["いわ"]?.[defender.type2] ?? 1.0;
      entryDamage += Math.floor(hp * (1 / 8) * rockMod1 * rockMod2);
    }
    if (isGrounded && spikes > 0) {
      const spikesRate = spikes === 1 ? (1/8) : spikes === 2 ? (1/6) : (1/4);
      entryDamage += Math.floor(hp * spikesRate);
    }
  }

  // ② ターン終了時ダメージ（砂嵐・毒・猛毒）
  const getTurnEndDamage = (turn: number) => {
    if (hasMagicGuard) return 0;
    let dmg = 0;

    // 砂嵐
    const isSandImmune = ["いわ", "じめん", "はがね"].includes(defender.type1) ||
                         ["いわ", "じめん", "はがね"].includes(defender.type2) ||
                         ["ぼうじん", "すなかき", "すなのちから", "すながくれ"].includes(defAbility);
    if (weather === "sand" && !isSandImmune) {
      dmg += Math.floor(hp / 16);
    }

    // 毒・猛毒
    if (isPoisoned) dmg += Math.floor(hp / 8);
    if (isBadlyPoisoned) dmg += Math.floor(hp * turn / 16); // 猛毒はターンごとにダメージ増

    return dmg;
  };

  // ==========================================
  // ⚔️ B. 最悪のケース（確定数）を計算
  // ==========================================
  let startHp = hp - entryDamage;
  if (startHp <= 0) return { text: "設置技ダメージで瀕死", color: "#ef4444", sub: "" };

  const calcMaxHits = () => {
    let tempHp = startHp;
    let hasUsedBerry = false;
    let h = 0;
    const minDmg = damageList[0]; // 最低乱数

    while (tempHp > 0 && h < 20) {
      h++;
      tempHp -= minDmg;
      if (tempHp <= 0) return h;

      // 回復処理
      if (item.name === "オボンの実" && !hasUsedBerry && tempHp <= hp / 2) {
        tempHp = Math.min(hp, tempHp + Math.floor(hp / 4));
        hasUsedBerry = true;
      }
      if (item.name === "たべのこし") tempHp = Math.min(hp, tempHp + Math.floor(hp / 16));

      // スリップダメージ処理
      tempHp -= getTurnEndDamage(h);
    }
    return h;
  };

  const maxHits = calcMaxHits();

  // ==========================================
  // 🎲 C. 確率分布をDPで爆速計算（1600万通り対応）
  // ==========================================
  let currentStates = new Map<string, number>();
  currentStates.set(`${startHp},0`, 1); // "現在のHP, オボン使用フラグ"

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
          killsThisTurn += count; // 直接の攻撃で倒した
        } else {
          let nextBerryUsed = berryUsed;
          
          // 回復処理
          if (item.name === "オボンの実" && !nextBerryUsed && nextHp <= hp / 2) {
            nextHp = Math.min(hp, nextHp + Math.floor(hp / 4));
            nextBerryUsed = true;
          }
          if (item.name === "たべのこし") {
            nextHp = Math.min(hp, nextHp + Math.floor(hp / 16));
          }

          // ターン終了時のスリップダメージ処理
          nextHp -= getTurnEndDamage(h);

          // スリップダメージで死んだか判定
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

  // ==========================================
  // 🎨 D. 表示テキストの生成
  // ==========================================
  const itemLabel = isRecovery ? `(${item.name}込み)` : "";
  const minHits = resultProbs.findIndex((p, i) => i > 0 && p > 0);
  
  if (minHits === -1) return { text: `確定7発以上`, color: "#6366f1", sub: itemLabel };

  const prob = resultProbs[minHits];
  const diff = maxHits - minHits;
  const maxHitsWarning = diff >= 2 ? ` / 確定${maxHits}発` : "";

  // 確率の桁数整形 (0.01%の壁対応)
  let probText = "";
  if (prob >= 99.9) probText = "100";
  else if (prob >= 0.1) probText = prob.toFixed(1);
  else if (prob >= 0.01) probText = prob.toFixed(2);
  else probText = "<0.01";

  if (prob >= 99.9) {
    return { text: `確定${minHits}発`, color: "#10b981", sub: itemLabel };
  }

  return {
    text: `乱数${minHits}発 (${probText}%)${maxHitsWarning}`,
    color: "#8b5cf6",
    sub: itemLabel
  };
};
  
  return (
    <main
      style={{
        padding: "20px",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        color: "#333",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        React練習用ダメ計ツール{" "}
      </h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          alignItems: "center", // ボタンを縦の真ん中に配置するため
        }}
      >
        {/* 攻撃側設定 */}
        <section
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "350px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#ff4d4d", borderBottom: "2px solid" }}>
            攻撃側
          </h2>
          <PokemonSearch
            label="攻撃側"
            onSelect={handleAttackerSelect}
            selectedPokemon={attacker}
          />
          {attacker && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginBottom: "10px",
                  width: "70%",
                }}
              >
                {/* 攻撃側の画像表示 */}
                {/* <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${attacker.id}.png`}
                alt={attacker.name}
                style={{
                  width: "50px",
                  height: "50px",
                  marginBottom: "10px",
                }}
              /> */}
                {/* 外部サイトではなく、自前の /public/pokemon/ フォルダから読み込む */}
                <Image
                  src={`/pokemon/${attacker.id}.png`}
                  alt={attacker.name}
                  width={32}
                  height={32}
                  // ローカル画像なので priority をつけると表示が早くなります
                  priority
                  // 画像がない場合のエラー対策
                  style={{ objectFit: "contain", imageRendering: "pixelated" }}
                />
                {/* タイプアイコン（右上絶対配置） */}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "-10px",
                    display: "flex",
                    gap: "2px",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <TypeBadge type={attacker.type1} />
                  {attacker.type2 && <TypeBadge type={attacker.type2} />}
                </div>
              </div>
              {/* 全種族値を表示（物理・特殊どちらも確認可能） */}
              <p
                style={{
                  fontSize: "0.8rem",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                種族値
              </p>
              <BaseStatsSummary pokemon={attacker} />
              {/* 努力値とスライダー */}
              <div style={{ marginTop: "15px" }}>
                {/* ラベルと数値の表示 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontSize: "0.8rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#ff4d4d" }}>
                    {atkEv}pt
                  </span>
                </div>

                {/* スライダー本体 */}
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={atkEv}
                  onChange={(e) => setAtkEv(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    accentColor: "#ff4d4d",
                  }}
                />
              </div>
              {/* 数値入力欄とクイックボタン */}
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <WheelNumberInput value={atkEv} onChange={setAtkEv} />
                <button
                  onClick={() => setAtkEv(0)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  0
                </button>
                <button
                  onClick={() => setAtkEv(32)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  32
                </button>
              </div>
              {/* 実数値 */}
              {(() => {
                const isPhysical = selectedMove?.category === "物理";
                const label = isPhysical ? "こうげき" : "とくこう";
                const baseStat = isPhysical
                  ? attacker.attack
                  : attacker.spAttack;
                const actualStat = calcStat(baseStat, atkEv, atkNature);

                return (
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      使用ステータス: {label}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                      種族値: {baseStat} →{" "}
                      <span style={{ color: "#af2101", fontWeight: "bold" }}>
                        実数値: {actualStat}
                      </span>
                    </p>
                  </div>
                );
              })()}{" "}
              {/* 性格補正 */}
              <div style={{ marginTop: "10px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    marginBottom: "5px",
                  }}
                >
                  性格補正
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontSize: "0.8rem",
                    justifyContent: "center",
                  }}
                >
                  {[
                    { label: "上昇 (1.1x)", value: 1.1 },
                    { label: "なし (1.0x)", value: 1.0 },
                    { label: "下降 (0.9x)", value: 0.9 },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <input
                        type="radio"
                        name="atkNature" // 攻撃側で統一
                        value={opt.value}
                        checked={atkNature === opt.value}
                        onChange={(e) => setAtkNature(Number(e.target.value))}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              {/* 攻撃側の持ち物と特性の選択エリア */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>
                    特性
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "4px",
                      color: "black",
                      borderRadius: "4px",
                      // ✅ メガシンカ時はグレーアウト
                      backgroundColor: isMega(attacker?.name)
                        ? "#e9e9e9"
                        : "#fff",
                      cursor: isMega(attacker?.name)
                        ? "not-allowed"
                        : "pointer",
                    }}
                    value={atkAbility}
                    onChange={(e) => setAtkAbility(e.target.value)}
                    disabled={isMega(attacker?.name)} // ✅ メガシンカ時は操作不能
                  >
                    {/* ✅ そのポケモンが持つ特性の配列を展開して選択肢にする */}
                    {getAbilitiesArray(attacker).map((ab) => (
                      <option key={ab} value={ab}>
                        {ab}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>
                    持ち物
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "4px",
                      color: "black",
                      borderRadius: "4px",
                      // ✅ メガシンカ時はグレーアウト
                      backgroundColor: isMega(attacker?.name)
                        ? "#e9e9e9"
                        : "#fff",
                      cursor: isMega(attacker?.name)
                        ? "not-allowed"
                        : "pointer",
                    }}
                    value={atkItem.name}
                    onChange={(e) =>
                      setAtkItem(
                        ITEMS.find((i) => i.name === e.target.value) ||
                          ITEMS[0],
                      )
                    }
                    disabled={isMega(attacker?.name)} // ✅ メガシンカ時は操作不能
                  >
                    {isMega(attacker?.name) ? (
                      // ✅ メガシンカ専用の選択肢
                      <option value="なし">メガストーン固定</option>
                    ) : (
                      // 通常の持ち物リスト
                      ITEMS.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              {/* 攻撃側のランク補正 */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap", // 画面が狭い時に折り返す
                }}
              >
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                  ランク
                </label>

                {/* ＋とーの大きなステッパー */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setAtkRank((prev) => Math.max(-6, prev - 1))}
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#f0f0f0",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      color: "#333",
                    }}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min="-6"
                    max="6"
                    value={atkRank}
                    onChange={(e) => setAtkRank(Number(e.target.value))}
                    style={{
                      width: "40px",
                      height: "30px",
                      textAlign: "center",
                      border: "none",
                      borderLeft: "1px solid #ccc",
                      borderRight: "1px solid #ccc",
                      color: "black",
                      margin: 0,
                      outline: "none",
                    }}
                  />

                  <button
                    onClick={() => setAtkRank((prev) => Math.min(6, prev + 1))}
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#f0f0f0",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      color: "#333",
                    }}
                  >
                    ＋
                  </button>
                </div>

                {/* よく使うクイックボタン */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setAtkRank((prev) => Math.max(-6, prev - 2))}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    -2
                  </button>
                  <button
                    onClick={() => setAtkRank(0)}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    0
                  </button>
                  <button
                    onClick={() => setAtkRank((prev) => Math.min(6, prev + 2))}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    +2
                  </button>
                </div>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#ff4d4d",
                    fontWeight: "bold",
                    marginLeft: "auto",
                  }}
                >
                  ({RANK_MODIFIERS[atkRank]}x)
                </span>
              </div>
              {/* 状態異常（やけど） */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap", // 画面が狭い時に折り返す
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    color: isAtkBurned ? "#d32f2f" : "#333",
                    fontWeight: isAtkBurned ? "bold" : "normal",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAtkBurned}
                    onChange={(e) => setIsAtkBurned(e.target.checked)}
                    style={{
                      marginRight: "6px",
                      accentColor: "#d32f2f",
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  やけど状態
                </label>
                {/* こんじょう発動時のアピール */}
                {isAtkBurned && atkAbility === "こんじょう" && (
                  <span
                    style={{
                      marginLeft: "10px",
                      fontSize: "0.7rem",
                      color: "#d97706",
                      backgroundColor: "#fef3c7",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    こんじょう発動(1.5x)
                  </span>
                )}
              </div>
              <div style={{ marginTop: "15px" }}>
                {/* 攻撃側の技検索 */}
                <MoveSearch
                  onSelect={setSelectedMove}
                  selectedPokemonId={attacker?.id} // ✅ ポケモンIDを渡す
                />
                {/* 選択された技の詳細表示 */}
                {selectedMove && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      borderLeft: `6px solid ${selectedMove.category === "物理" ? "#ff4d4d" : selectedMove.category === "特殊" ? "#4d79ff" : "#888"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                        {selectedMove.name}
                      </span>
                      <span style={{ fontWeight: "bold", color: "#333" }}>
                        威力:{" "}
                        {selectedMove.power && selectedMove.power > 0
                          ? selectedMove.power
                          : "—"}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "0.85rem",
                        color: "#666",
                        display: "flex",
                        // justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <span>タイプ: {selectedMove.type}</span>
                      <span>分類: {selectedMove.category}</span>
                      {/* タイプ一致の判定例（てきおうりょく対応版） */}
                      {(selectedMove.type === attacker.type1 ||
                        selectedMove.type === attacker.type2) && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.7rem",
                            // てきおうりょくなら赤系、通常ならオレンジ系に切り替え
                            color:
                              atkAbility === "てきおうりょく"
                                ? "#d32f2f"
                                : "#e67e22",
                            backgroundColor:
                              atkAbility === "てきおうりょく"
                                ? "#ffebee"
                                : "#fef5e7",
                            border: `1px solid ${atkAbility === "てきおうりょく" ? "#ffcdd2" : "#fad7a0"}`,
                            padding: "2px 5px",
                            borderRadius: "4px",
                            alignItems: "right",
                            fontWeight:
                              atkAbility === "てきおうりょく"
                                ? "bold"
                                : "normal",
                          }}
                        >
                          タイプ一致(
                          {atkAbility === "てきおうりょく" ? "2.0x" : "1.5x"})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

{/* === 中央エリア（入れ替えボタン ＆ 天候・フィールド） === */}
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", // 縦並びにする
            alignItems: "center",    // 中央寄せ
            justifyContent: "center", 
            gap: "20px",             // ボタンとパネルの間の隙間
            width: "10%",            // 必要に応じて幅を調整
          }}
        >
          {/* 入れ替えボタン */}
          <button
            onClick={handleSwap}
            title="攻撃と防御を入れ替える"
            style={{
              backgroundColor: "#fff",
              border: "2px solid #ddd",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#666",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.borderColor = "#999";
              e.currentTarget.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.color = "#666";
            }}
          >
            ⇄
          </button>

          {/* 天候・フィールド設定エリア */}
          <div
            style={{
              width: "100%", // 親コンテナの幅に合わせる
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column", // 中の天候とフィールドも縦に並べるならこちら
              gap: "10px",
            }}
          >
            {/* 天候 */}
            <div>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "5px" }}>☀️ 天候</span>
              <div style={{ display: "flex", gap: "5px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                {[
                  { label: "なし", value: "none" },
                  { label: "晴れ", value: "sun" },
                  { label: "雨", value: "rain" },
                  { label: "砂嵐", value: "sand" },
                  { label: "雪", value: "snow" },
                ].map((w) => (
                  <label key={w.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input
                      type="radio"
                      name="weather"
                      value={w.value}
                      checked={weather === w.value}
                      onChange={(e) => setWeather(e.target.value)}
                    />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>

            {/* フィールド */}
            <div>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "5px" }}>🌱 フィールド</span>
              <div style={{ display: "flex", gap: "5px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                {[
                  { label: "なし", value: "none" },
                  { label: "エレキ", value: "electric" },
                  { label: "グラス", value: "grassy" },
                  { label: "ミスト", value: "misty" },
                  { label: "サイコ", value: "psychic" },
                ].map((t) => (
                  <label key={t.value} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input
                      type="radio"
                      name="terrain"
                      value={t.value}
                      checked={terrain === t.value}
                      onChange={(e) => setTerrain(e.target.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
<div style={{ borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "5px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>🪨 設置技・状態異常</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                
                {/* ステルスロック */}
                <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <input
                    type="checkbox"
                    checked={isStealthRock}
                    onChange={(e) => setIsStealthRock(e.target.checked)}
                  />
                  ステルスロック
                </label>

                {/* まきびし */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ color: "#555" }}>まきびし:</span>
                  {[0, 1, 2, 3].map((num) => (
                    <label key={`spikes-${num}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                      <input
                        type="radio"
                        name="spikes"
                        value={num}
                        checked={spikes === num}
                        onChange={() => setSpikes(num)}
                      />
                      {num}回
                    </label>
                  ))}
                </div>

                {/* 毒状態（排他選択） */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ color: "#555" }}>毒状態:</span>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input 
                      type="radio" 
                      name="poison" 
                      checked={!isPoisoned && !isBadlyPoisoned} 
                      onChange={() => { setIsPoisoned(false); setIsBadlyPoisoned(false); }} 
                    /> なし
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input 
                      type="radio" 
                      name="poison" 
                      checked={isPoisoned} 
                      onChange={() => { setIsPoisoned(true); setIsBadlyPoisoned(false); }} 
                    /> 毒
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                    <input 
                      type="radio" 
                      name="poison" 
                      checked={isBadlyPoisoned} 
                      onChange={() => { setIsPoisoned(false); setIsBadlyPoisoned(true); }} 
                    /> 猛毒
                  </label>
                </div>

              </div>
            </div>
            
          </div>
        </div>



        {/* 防御側設定 */}
        <section
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "350px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#4d79ff", borderBottom: "2px solid" }}>
            防御側
          </h2>
          <PokemonSearch
            label="防御側"
            onSelect={handleDefenderSelect}
            selectedPokemon={defender}
          />
          {defender && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              {/* 防御側の画像表示 */}
              {/* <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${defender.id}.png`}
                alt={defender.name}
                style={{
                  width: "50px",
                  height: "50px",
                  marginBottom: "10px",
                }}
              /> */}
              {/* 外部サイトではなく、自前の /public/pokemon/ フォルダから読み込む */}
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginBottom: "10px",
                  width: "70%",
                }}
              >
                {/* 外部サイトではなく、自前の /public/pokemon/ フォルダから読み込む
                <Image
                  src={`/pokemon/${defender.id}.png`}
                  alt={defender.name}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain" }}
                /> */}
                {/* 外部サイトではなく、自前の /public/pokemon/ フォルダから読み込む */}
                <Image
                  src={`/pokemon/${defender.id}.png`}
                  alt={defender.name}
                  width={32}
                  height={32}
                  // ローカル画像なので priority をつけると表示が早くなります
                  priority
                  // 画像がない場合のエラー対策
                  style={{ objectFit: "contain", imageRendering: "pixelated" }}
                />
                {/* タイプアイコン（右上絶対配置） */}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "-10px",
                    display: "flex",
                    gap: "2px",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <TypeBadge type={defender.type1} />
                  {defender.type2 && <TypeBadge type={defender.type2} />}
                </div>
              </div>
              {/* 種族値 */}
              <p
                style={{
                  fontSize: "0.8rem",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                種族値
              </p>
              <BaseStatsSummary pokemon={defender} />

              <label style={{ display: "block", fontSize: "0.9rem" }}>
                HP 努力値
              </label>
              <div style={{ marginTop: "15px" }}>
                {/* ラベルと数値の表示 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontSize: "0.9rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#163488" }}>
                    {defHpEv}pt
                  </span>
                </div>

                {/* スライダー本体 */}
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={defHpEv}
                  onChange={(e) => setDefHpEv(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    accentColor: "#163488",
                  }}
                />
              </div>
              {/* 数値入力欄とクイックボタン */}
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <WheelNumberInput value={defHpEv} onChange={setDefHpEv} />
                <button
                  onClick={() => setDefHpEv(0)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  0
                </button>
                <button
                  onClick={() => setDefHpEv(32)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  32
                </button>
              </div>
              {/* HPの実数値表示 */}
              <div
                style={{
                  padding: "8px",
                  backgroundColor: "#f0f5ff",
                  borderRadius: "5px",
                  marginBottom: "10px",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold" }}>HP</p>
                <p style={{ margin: "2px 0", fontSize: "0.9rem" }}>
                  種族値: {defender.hp} →{" "}
                  <span style={{ fontWeight: "bold" }}>
                    実数値: {calcStat(defender.hp, defHpEv, 1.0, true)}
                  </span>
                </p>
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  paddingTop: "15px",
                  marginTop: "20px",
                  borderTop: "1px solid #ccc",
                }}
              >
                防御側の耐久努力値
              </label>
              <div style={{ marginTop: "15px" }}>
                {/* ラベルと数値の表示 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={{ fontSize: "0.8rem" }}>努力値 (0-32)</label>
                  <span style={{ fontWeight: "bold", color: "#163488" }}>
                    {defEv}pt
                  </span>
                </div>

                {/* スライダー本体 */}
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={defEv}
                  onChange={(e) => setDefEv(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    accentColor: "#163488",
                  }}
                />
              </div>
              {/* 数値入力欄とクイックボタン */}
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <WheelNumberInput value={defEv} onChange={setDefEv} />
                <button
                  onClick={() => setDefEv(0)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  0
                </button>
                <button
                  onClick={() => setDefEv(32)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  32
                </button>
              </div>
              {/* 防御/特防の切り替え表示 */}
              {(() => {
                const isPhysical = selectedMove?.category === "物理";
                const label = isPhysical ? "ぼうぎょ" : "とくぼう";
                const baseStat = isPhysical
                  ? defender.defense
                  : defender.spDefense;
                const actualStat = calcStat(baseStat, defEv, defNature);

                return (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "8px",
                      backgroundColor: "#f0f5ff",
                      borderRadius: "5px",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}>
                      種族値: {baseStat} →{" "}
                      <span style={{ fontWeight: "bold" }}>
                        実数値: {actualStat}
                      </span>
                    </p>
                  </div>
                );
              })()}
              <div style={{ marginTop: "10px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    marginBottom: "5px",
                  }}
                >
                  性格補正
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontSize: "0.8rem",
                    justifyContent: "center",
                  }}
                >
                  {[
                    { label: "上昇 (1.1x)", value: 1.1 },
                    { label: "なし (1.0x)", value: 1.0 },
                    { label: "下降 (0.9x)", value: 0.9 },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <input
                        type="radio"
                        name="defNature" // 防御側で統一
                        value={opt.value}
                        checked={defNature === opt.value}
                        onChange={(e) => setDefNature(Number(e.target.value))}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 防御側の持ち物と特性の選択エリア */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>
                    特性
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "4px",
                      color: "black",
                      borderRadius: "4px",
                      backgroundColor: isMega(defender?.name)
                        ? "#e9e9e9"
                        : "#fff",
                      cursor: isMega(defender?.name)
                        ? "not-allowed"
                        : "pointer",
                    }}
                    value={defAbility}
                    onChange={(e) => {
                      setDefAbility(e.target.value);
                      if (e.target.value === "いかく") {
                        setAtkRank((prev) => Math.max(-6, prev - 1));
                      }
                    }}
                    disabled={isMega(defender?.name)}
                  >
                    {getAbilitiesArray(defender).map((ab) => (
                      <option key={ab} value={ab}>
                        {ab}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.7rem", display: "block" }}>
                    持ち物
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "4px",
                      color: "black",
                      borderRadius: "4px",
                      backgroundColor: isMega(defender?.name)
                        ? "#e9e9e9"
                        : "#fff",
                      cursor: isMega(defender?.name)
                        ? "not-allowed"
                        : "pointer",
                    }}
                    value={defItem.name}
                    onChange={(e) =>
                      setDefItem(
                        ITEMS.find((i) => i.name === e.target.value) ||
                          ITEMS[0],
                      )
                    }
                    disabled={isMega(defender?.name)}
                  >
                    {isMega(defender?.name) ? (
                      <option value="なし">メガストーン固定</option>
                    ) : (
                      ITEMS.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              {/* 防御側のランク補正 */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                  ランク
                </label>

                {/* ＋とーの大きなステッパー */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setDefRank((prev) => Math.max(-6, prev - 1))}
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#f0f0f0",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      color: "#333",
                    }}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min="-6"
                    max="6"
                    value={defRank}
                    onChange={(e) => setDefRank(Number(e.target.value))}
                    style={{
                      width: "40px",
                      height: "30px",
                      textAlign: "center",
                      border: "none",
                      borderLeft: "1px solid #ccc",
                      borderRight: "1px solid #ccc",
                      color: "black",
                      margin: 0,
                      outline: "none",
                    }}
                  />

                  <button
                    onClick={() => setDefRank((prev) => Math.min(6, prev + 1))}
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#f0f0f0",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      color: "#333",
                    }}
                  >
                    ＋
                  </button>
                </div>

                {/* よく使うクイックボタン */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setDefRank((prev) => Math.max(-6, prev - 2))}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    -2
                  </button>
                  <button
                    onClick={() => setDefRank(0)}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    0
                  </button>
                  <button
                    onClick={() => setDefRank((prev) => Math.min(6, prev + 2))}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    +2
                  </button>
                </div>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#4d79ff",
                    fontWeight: "bold",
                    marginLeft: "auto",
                  }}
                >
                  ({RANK_MODIFIERS[defRank]}x)
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 計算結果表示エリア */}
<div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
  <div style={{ padding: "30px", backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "600px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #eaeaea" }}>
    
    {!res ? (
      <p style={{ textAlign: "center", color: "#999" }}>ポケモンと技を選択してダメージを測定</p>
    ) : res.isStatus ? (
      <h2 style={{ textAlign: "center", color: "#888" }}>変化技（ダメージなし）</h2>
    ) : (
      <>
        {/* 1. 状態バッジ */}
        {(() => {
          const badge = getBadgeStyle(res.ohkoProb);
          return (
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", backgroundColor: badge.bg, color: badge.text }}>
                {badge.label}
              </span>
            </div>
          );
        })()}

        {/* 2. ダメージ数値 */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0" }}>ダメージ範囲</p>
          <h2 style={{ fontSize: "3rem", fontWeight: "900", margin: "5px 0", color: "#1a1a1a" }}>
            {res.effectiveness === 0 ? "0" : `${Math.max(1, res.min)} 〜 ${Math.max(1, res.max)}`}
          </h2>
          <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#666" }}>
            （{((res.min / res.hp) * 100).toFixed(1)}% 〜 {((res.max / res.hp) * 100).toFixed(1)}%）
          </p>
        </div>

        {/* 3. HPバー */}
        {res.effectiveness > 0 && <DamageBar hp={res.hp} minDam={res.min} maxDam={res.max} />}

        {/* 4. 確定数エリア（ここが劇的に短くなりました） */}
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
