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
// ✅ 追加：絶対に画面をスクロールさせない数値入力コンポーネント
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
  { name: "たつじんのおび", multiplier: 1.3, type: "dmg" },
  { name: "とつげきチョッキ", multiplier: 1.5, type: "spd" },
  { name: "オボンの実", multiplier: 0.25, type: "heal" }, // HPバー連動用
  { name: "メガストーン", multiplier: 1, type: "none" }, // 表示用
];
// 計算に影響する特性リスト（代表的なもの）
const RELEVANT_ABILITIES = [
  // { name: "なし", multiplier: 1.0 },
  { name: "てきおうりょく", multiplier: 2.0 }, // タイプ一致が2倍に(技側で計算)
  { name: "ちからもち", multiplier: 2.0 }, // 攻撃2倍
  { name: "かたいツメ", multiplier: 1.3 }, // 直接攻撃1.3倍
  { name: "マルチスケイル", multiplier: 0.5 }, // ダメージ半減
  { name: "いかく", multiplier: 1.0 },
  { name: "こんじょう", multiplier: 1.5 }, // ✅ 追加（状態異常で攻撃1.5倍）
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

// ✅ 追加：タイプごとの色定義（原作準拠）
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

// ✅ 追加：タイプアイコンコンポーネント
const TypeBadge = ({ type }: { type: string }) => {
  const colors = TYPE_COLORS[type] || { bg: "#666", text: "#fff" }; // 未定義タイプへのフォールバック
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "6px", // 丸みを持たせる
        fontSize: "0.7rem",
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

    // ✅ 追加：防御側が「いかく」を持って場に出たなら、攻撃側のランクを下げる
    if (initialAbility === "いかく") {
      setAtkRank((prev) => Math.max(-6, prev - 1));
    }
  };

  // --- ダメージ計算ロジック ---
  const calculateResult = () => {
    if (!attacker || !defender || !selectedMove) return null;

    if (selectedMove.category === "変化") {
      return {
        min: 0,
        max: 0,
        hp: 100,
        effectiveness: 0,
        ohkoProb: 0,
        isStatus: true,
      };
    }

    const isPhysical = selectedMove.category === "物理";
    const finalHp = calcStat(defender.hp, defHpEv, 1.0, true);
    const isFullHp = true;

    // 選択された特性のデータを配列から取得（見つからなければ倍率1.0）
    const atkAbil = RELEVANT_ABILITIES.find((a) => a.name === atkAbility) || {
      name: "なし",
      multiplier: 1.0,
    };
    const defAbil = RELEVANT_ABILITIES.find((a) => a.name === defAbility) || {
      name: "なし",
      multiplier: 1.0,
    };

    // 1. 攻撃力のステータス計算
    let a = calcStat(
      isPhysical ? attacker.attack : attacker.spAttack,
      atkEv,
      atkNature,
    );
    a = Math.floor(a * RANK_MODIFIERS[atkRank]);

    // 定数の multiplier を使用（ちからもち等の攻撃ステータス補正）
    if (atkAbility === "ちからもち" && isPhysical) {
      a = Math.floor(a * atkAbil.multiplier);
    }

    if (atkItem.type === (isPhysical ? "atk" : "spa")) {
      a = Math.floor(a * atkItem.multiplier);
    }

    // やけど ＆ こんじょうの処理
    if (isAtkBurned && isPhysical) {
      if (atkAbility === "こんじょう") {
        // こんじょうなら攻撃1.5倍（やけどの半減は無視）
        a = Math.floor(a * atkAbil.multiplier);
      } else {
        // それ以外なら攻撃0.5倍
        a = Math.floor(a * 0.5);
      }
    }

    // 2. 防御力のステータス計算
    let d = calcStat(
      isPhysical ? defender.defense : defender.spDefense,
      defEv,
      defNature,
    );
    d = Math.floor(d * RANK_MODIFIERS[defRank]);
    if (defItem.type === (isPhysical ? "def" : "spd")) {
      d = Math.floor(d * defItem.multiplier);
    }

    // 3. 基本ダメージ計算
    let baseDamage = Math.floor(
      Math.floor((Math.floor((2 * 50) / 5 + 2) * selectedMove.power * a) / d) /
        50 +
        2,
    );

    // 4. 特性・持ち物による最終ダメージ倍率
    // （※てきおうりょくはSTAB部分での特殊計算）
    const stab =
      selectedMove.type === attacker.type1 ||
      selectedMove.type === attacker.type2
        ? atkAbility === "てきおうりょく"
          ? atkAbil.multiplier
          : 1.5
        : 1.0;
    baseDamage = Math.floor(baseDamage * stab);

    // （かたいツメのダメージ補正）
    if (atkAbility === "かたいツメ" && isPhysical) {
      baseDamage = Math.floor(baseDamage * atkAbil.multiplier);
    }

    if (atkItem.type === "dmg") {
      baseDamage = Math.floor(baseDamage * atkItem.multiplier);
    }

    // （マルチスケイルのダメージ軽減）
    if (defAbility === "マルチスケイル" && isFullHp) {
      baseDamage = Math.floor(baseDamage * defAbil.multiplier);
    }

    // 5. タイプ相性補正
    const type1Mod = TYPE_CHART[selectedMove.type]?.[defender.type1] ?? 1.0;
    const type2Mod = defender.type2
      ? (TYPE_CHART[selectedMove.type]?.[defender.type2] ?? 1.0)
      : 1.0;
    const effectiveness = type1Mod * type2Mod;
    baseDamage = Math.floor(baseDamage * effectiveness);

    // --- 乱数計算 ---
    const damageList = [];
    for (let i = 85; i <= 100; i++) {
      damageList.push(Math.floor((baseDamage * i) / 100));
    }

    const ohkoCount = damageList.filter((d) => d >= finalHp).length;
    const ohkoProb = (ohkoCount / 16) * 100;

    return {
      min: damageList[0],
      max: damageList[15],
      hp: finalHp,
      effectiveness,
      ohkoProb,
      isStatus: false,
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
        ダメージ計算機
      </h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          alignItems: "center", // ✅ 追加：ボタンを縦の真ん中に配置するため
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
            label="攻撃側ポケモン"
            onSelect={setAttacker}
            selectedPokemon={attacker} // ✅ これを追加！
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
                  width={100}
                  height={100}
                  // ローカル画像なので priority をつけると表示が早くなります
                  priority
                  // 画像がない場合のエラー対策
                  style={{ objectFit: "contain" }}
                />
                {/* ✅ 追加：タイプアイコン（右上絶対配置） */}
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
                {/* --- ここから追加：選択された技の詳細表示 --- */}
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

        {/* ✅ 追加：ここに入れ替えボタンを配置！ */}
        <div style={{ display: "flex", justifyContent: "center" }}>
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
            label="防御側ポケモン"
            onSelect={setDefender}
            selectedPokemon={defender} // ✅ これを追加！
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
                {/* 外部サイトではなく、自前の /public/pokemon/ フォルダから読み込む */}
                <Image
                  src={`/pokemon/${defender.id}.png`}
                  alt={defender.name}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain" }}
                />

                {/* ✅ 追加：タイプアイコン（右上絶対配置） */}
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
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "30px",
            backgroundColor: "#ffffff", // 白ベースに変更
            color: "#333",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)", // ふんわりした影
            border: "1px solid #eaeaea",
          }}
        >
          {!res ? (
            <p style={{ textAlign: "center", color: "#999" }}>
              ポケモンと技を選択してダメージを測定
            </p>
          ) : res.isStatus ? (
            <h2 style={{ textAlign: "center", color: "#888" }}>
              変化技（ダメージなし）
            </h2>
          ) : (
            <>
              {/* 状態表示ラベル */}
              <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    backgroundColor:
                      res.ohkoProb === 100
                        ? "#fee2e2"
                        : res.ohkoProb > 0
                          ? "#fef3c7"
                          : "#dcfce7",
                    color:
                      res.ohkoProb === 100
                        ? "#ef4444"
                        : res.ohkoProb > 0
                          ? "#d97706"
                          : "#16a34a",
                  }}
                >
                  {res.ohkoProb === 100
                    ? "High Damage"
                    : res.ohkoProb > 0
                      ? "Chance"
                      : "Safe"}
                </span>
              </div>

              {/* メインダメージ数値 */}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "0",
                  }}
                >
                  ダメージ範囲
                </p>
                <h2
                  style={{
                    fontSize: "3rem",
                    fontWeight: "900",
                    margin: "5px 0",
                    color: "#1a1a1a",
                  }}
                >
                  {res.effectiveness === 0
                    ? "0"
                    : `${Math.max(1, res.min)} 〜 ${Math.max(1, res.max)}`}
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#666",
                  }}
                >
                  （{((res.min / res.hp) * 100).toFixed(1)}% 〜{" "}
                  {((res.max / res.hp) * 100).toFixed(1)}%）
                </p>
              </div>

              {/* HPバー */}
              {res.effectiveness > 0 && (
                <DamageBar hp={res.hp} minDam={res.min} maxDam={res.max} />
              )}

              {/* 確定数メッセージ */}
              <div
                style={{
                  textAlign: "center",
                  padding: "15px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  marginTop: "10px",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {res.ohkoProb === 100 ? (
                    <span style={{ color: "#ef4444" }}>確定1発</span>
                  ) : res.ohkoProb > 0 ? (
                    <span style={{ color: "#f59e0b" }}>
                      乱数1発 ({res.ohkoProb.toFixed(1)}%)
                    </span>
                  ) : (
                    <span style={{ color: "#10b981" }}>確定耐え</span>
                  )}
                </div>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "0.9rem",
                    color: "#888",
                  }}
                >
                  相性倍率: {res.effectiveness}x
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
