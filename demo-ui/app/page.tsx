"use client";

import { useState } from "react";
import PokemonSearch from "../src/components/PokemonSearch";
import MoveSearch from "../src/components/MoveSearch"; // ← 忘れずに作成してくださいね！

export default function Home() {
  const [attacker, setAttacker] = useState<any>(null);
  const [defender, setDefender] = useState<any>(null);
  const [selectedMove, setSelectedMove] = useState<any>(null);
  const [selectedAbility, setSelectedAbility] = useState("");

  // --- ダメージ計算ロジック ---
  const calculateResult = () => {
    if (!attacker || !defender || !selectedMove) return "データ不足";

    // 物理なら「攻撃」、特殊なら「特攻」を自動で切り替える
    const atkStat =
      selectedMove.category === "物理" ? attacker.attack : attacker.spAttack;
    const defStat =
      selectedMove.category === "物理" ? defender.defense : defender.spDefense;
    const power = selectedMove.power || 0;

    if (power === 0) return "ダメージなし（変化技）";

    // 簡易ダメージ計算式
    // $Damage = ((2 \times Level/5 + 2) \times Power \times Atk / Def / 50 + 2)$
    // 今回はレベル50固定(22)で計算
    const damage = Math.floor((22 * power * atkStat) / defStat / 50 + 2);
    return `${damage} ダメージ`;
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
      <h1
        style={{ textAlign: "center", color: "#1a1a1a", marginBottom: "30px" }}
      >
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
        {/* 左側：攻撃側（自分） */}
        <section
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "350px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{ borderBottom: "2px solid #ff4d4d", paddingBottom: "10px" }}
          >
            攻撃側
          </h2>
          <PokemonSearch label="ポケモン検索" onSelect={setAttacker} />

          {attacker && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                backgroundColor: "#fff5f5",
                borderRadius: "5px",
              }}
            >
              <h3>{attacker.name}</h3>

              {/* 特性選択：そのポケモンの持つ特性だけをリストにする */}
              <label
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginTop: "10px",
                }}
              >
                特性
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "5px",
                  marginBottom: "15px",
                  color: "black",
                }}
                onChange={(e) => setSelectedAbility(e.target.value)}
              >
                <option value={attacker.ability1}>{attacker.ability1}</option>
                {attacker.ability2 && (
                  <option value={attacker.ability2}>{attacker.ability2}</option>
                )}
                {attacker.hiddenAbility && (
                  <option value={attacker.hiddenAbility}>
                    {attacker.hiddenAbility} (夢)
                  </option>
                )}
              </select>

              {/* 技検索窓 */}
              <MoveSearch onSelect={setSelectedMove} />

              {selectedMove && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.8rem",
                    borderTop: "1px dashed #ccc",
                    paddingTop: "5px",
                  }}
                >
                  <p>
                    選択中の技: <strong>{selectedMove.name}</strong>
                  </p>
                  <p>
                    威力: {selectedMove.power} / 分類: {selectedMove.category}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 右側：防御側（相手） */}
        <section
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "350px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{ borderBottom: "2px solid #4d79ff", paddingBottom: "10px" }}
          >
            防御側
          </h2>
          <PokemonSearch label="ポケモン検索" onSelect={setDefender} />

          {defender && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                backgroundColor: "#f5f7ff",
                borderRadius: "5px",
              }}
            >
              <h3>{defender.name}</h3>
              <p>
                防御: {defender.defense} / 特防: {defender.spDefense}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* 計算結果セクション */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#aedfff",
            color: "white",
            borderRadius: "15px",
          }}
        >
          <p style={{ margin: 0, fontSize: "1.2rem", color: "#16335e" }}>
            予想ダメージ
          </p>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#d85c77" }}>
            {calculateResult()}
          </h2>
        </div>
      </div>
    </main>
  );
}
