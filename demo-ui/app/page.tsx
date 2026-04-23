"use client";

import { useState } from "react";
import PokemonSearch from "../src/components/PokemonSearch";
import MoveSearch from "../src/components/MoveSearch";
import Image from "next/image";

// タイプ相性表（前回のものを使用）
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
const BaseStatsSummary = ({ pokemon }: { pokemon: any }) => (
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
export default function Home() {
  const [attacker, setAttacker] = useState<any>(null);
  const [defender, setDefender] = useState<any>(null);
  const [selectedMove, setSelectedMove] = useState<any>(null);

  // --- Homeコンポーネント内：努力値の管理を 0〜32 の範囲に変更 ---
  const [atkEv, setAtkEv] = useState(32); // 攻撃側：最大(32)で初期化
  const [atkNature, setAtkNature] = useState(1.1);

  const [defHpEv, setDefHpEv] = useState(32); // 防御側HP：最大(32)で初期化
  const [defEv, setDefEv] = useState(0); // 防御側耐久：0で初期化
  const [defNature, setDefNature] = useState(1.0);

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

  // --- ダメージ計算ロジック ---
  const calculateResult = () => {
    if (!attacker || !defender || !selectedMove) return null;

    const level = 50;
    const isPhysical = selectedMove.category === "物理";

    // 1. 攻撃側の能力値決定
    const attackStat = isPhysical ? attacker.attack : attacker.spAttack;
    const finalAtk = calcStat(attackStat, atkEv, atkNature);

    // 2. 防御側の能力値決定
    const defenseStat = isPhysical ? defender.defense : defender.spDefense;
    const finalDef = calcStat(defenseStat, defEv, defNature);
    const finalHp = calcStat(defender.hp, defHpEv, 1.0, true);

    const power = selectedMove.power || 0;
    if (power === 0) return { isStatus: true };

    // 3. 基本ダメージ計算（補正前の最大ダメージを算出）
    let baseDamage = Math.floor(
      Math.floor(
        (Math.floor((2 * level) / 5 + 2) * power * finalAtk) / finalDef,
      ) /
        50 +
        2,
    );

    // 4. タイプ一致補正 (1.5倍)
    if (
      selectedMove.type === attacker.type1 ||
      selectedMove.type === attacker.type2
    ) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }

    // 5. タイプ相性補正 (0倍〜4倍)
    const type1Mod = TYPE_CHART[selectedMove.type]?.[defender.type1] ?? 1.0;
    const type2Mod = defender.type2
      ? (TYPE_CHART[selectedMove.type]?.[defender.type2] ?? 1.0)
      : 1.0;
    const effectiveness = type1Mod * type2Mod;
    baseDamage = Math.floor(baseDamage * effectiveness);

    // --- ここから「乱数1発」の確率計算を追加 ---

    // 85%から100%までの16段階のダメージ値を配列に格納
    const damageList = [];
    for (let i = 85; i <= 100; i++) {
      // 各パーセンテージを掛けて小数点以下切り捨て
      damageList.push(Math.floor((baseDamage * i) / 100));
    }

    // 相手のHP以上のダメージがいくつあるかカウント
    const ohkoCount = damageList.filter((d) => d >= finalHp).length;
    // 16個中の割合をパーセントに変換 (例: 8個なら 50.0%)
    const ohkoProb = (ohkoCount / 16) * 100;

    return {
      min: damageList[0], // 最小(85%)
      max: damageList[15], // 最大(100%)
      hp: finalHp, // 相手のHP実数値
      effectiveness, // 相性倍率
      ohkoProb, // 倒せる確率(%)
    };
  };
  const res = calculateResult();

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
          <PokemonSearch label="ポケモン" onSelect={setAttacker} />
          {attacker && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
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
              {/* 技の分類によって A か C かを判断
              {(() => {
                const isPhysical = selectedMove?.category === "物理";
                const label = isPhysical ? "こうげき" : "とくこう";
                const baseStat = isPhysical
                  ? attacker.attack
                  : attacker.spAttack;
                // 実数値を計算
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
                      <span
                        style={{
                          color: "#af2101",
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                        }}
                      >
                        実数値: {actualStat}
                      </span>
                    </p>
                  </div>
                );
              })()}{" "} */}
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
              })()}
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
              {/* 数値入力欄も残す */}
              <div style={{ textAlign: "left" }}>
                <input
                  type="number"
                  value={atkEv}
                  onChange={(e) => setAtkEv(Number(e.target.value))}
                  style={{ width: "60px", color: "black" }}
                />
              </div>
              {/* 性格補正 */}
              <div style={{ marginTop: "15px" }}>
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
              <div style={{ marginTop: "15px" }}>
                <MoveSearch onSelect={setSelectedMove} />
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
                      {/* タイプ一致の判定例 */}
                      {(selectedMove.type === attacker.type1 ||
                        selectedMove.type === attacker.type2) && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.7rem",
                            color: "#e67e22",
                            backgroundColor: "#fef5e7",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            border: "1px solid #fad7a0",
                            alignItems: "right",
                          }}
                        >
                          タイプ一致(1.5x)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* --- ここまで追加 --- */}
              </div>
            </div>
          )}
        </section>

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
          <PokemonSearch label="ポケモン" onSelect={setDefender} />
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
              <Image
                src={`/pokemon/${defender.id}.png`}
                alt={defender.name}
                width={100}
                height={100}
                style={{ objectFit: "contain" }}
              />
              {/* HPの実数値表示 */}
              <BaseStatsSummary pokemon={defender} />{" "}
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
              {/* 数値入力欄も残す */}
              <div style={{ textAlign: "left" }}>
                <input
                  type="number"
                  value={defHpEv}
                  onChange={(e) => setDefHpEv(Number(e.target.value))}
                  style={{ width: "60px", color: "black" }}
                />
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
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginTop: "10px",
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
              {/* 数値入力欄も残す */}
              <div style={{ textAlign: "left" }}>
                <input
                  type="number"
                  value={defEv}
                  onChange={(e) => setDefEv(Number(e.target.value))}
                  style={{ width: "60px", color: "black" }}
                />
              </div>
              <div style={{ marginTop: "15px" }}>
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
            </div>
          )}
        </section>
      </div>

      {/* 計算結果表示エリア */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px",
            backgroundColor: "#061218ea",
            color: "white",
            borderRadius: "20px",
            minWidth: "400px",
          }}
        >
          {!res ? (
            <p>ポケモンと技を選択してください</p>
          ) : res.isStatus ? (
            <h2>変化技（ダメージなし）</h2>
          ) : (
            <>
              <p style={{ color: "#aaa" }}>ダメージ範囲</p>
              <h2
                style={{
                  fontSize: "1.5rem",
                  color: "#d1d406",
                  margin: "10px 0",
                }}
              >
                {res.effectiveness === 0
                  ? "0"
                  : `${Math.max(1, res.min)} 〜 ${Math.max(1, res.max)}`}
              </h2>

              {/* HPに対する割合と確定数の表示 */}
              {res.effectiveness > 0 && (
                <div
                  style={{
                    fontSize: "1.2rem",
                    borderTop: "1px solid #444",
                    paddingTop: "5px",
                  }}
                >
                  <p>相手のHP実数値: {res.hp}</p>
                  <p
                    style={{ color: res.min >= res.hp ? "#ff4d4d" : "#4ade80" }}
                  >
                    割合: {((res.min / res.hp) * 100).toFixed(1)}% 〜{" "}
                    {((res.max / res.hp) * 100).toFixed(1)}%
                  </p>

                  {/* --- 倒せる確率の表示を詳細化 --- */}
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {res.ohkoProb === 100 ? (
                      <span style={{ color: "#ff4d4d" }}>確定1発</span>
                    ) : res.ohkoProb > 0 ? (
                      <span style={{ color: "#ffed4a" }}>
                        乱数1発 ({res.ohkoProb.toFixed(1)}%)
                      </span>
                    ) : (
                      <span style={{ color: "#4ade80" }}>確定耐え</span>
                    )}
                  </div>
                </div>
              )}

              <p
                style={{
                  marginTop: "10px",
                  fontWeight: "bold",
                  color:
                    res.effectiveness >= 4
                      ? "#ff0000"
                      : res.effectiveness >= 2
                        ? "#ff4d4d"
                        : res.effectiveness === 0
                          ? "#aaa"
                          : res.effectiveness <= 0.25
                            ? "#7a70ff"
                            : res.effectiveness < 1
                              ? "#49c3f3"
                              : "white",
                }}
              >
                {res.effectiveness >= 4
                  ? "効果は かなり ばつぐんだ！！"
                  : res.effectiveness >= 2
                    ? "効果は ばつぐんだ！"
                    : res.effectiveness === 0
                      ? "効果が ない ようだ…"
                      : res.effectiveness <= 0.25
                        ? "効果は かなり いまひとつのようだ…"
                        : res.effectiveness < 1
                          ? "効果は いまひとつのようだ…"
                          : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
