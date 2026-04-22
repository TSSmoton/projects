"use client"; // Reactのフック（useStateなど）を使うために必要です

import { useState } from "react";
// あとで作成する「検索窓パーツ」を読み込みます
// エラーが出る場合は path を ../src/components/PokemonSearch に書き換えてください
import PokemonSearch from "../src/components/PokemonSearch";

export default function Home() {
  // 選択されたポケモンのデータを保存する変数
  const [attacker, setAttacker] = useState<any>(null);
  const [defender, setDefender] = useState<any>(null);

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
        計算機
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
          <PokemonSearch label="検索" onSelect={setAttacker} />

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
              <p>
                タイプ: {attacker.type1}{" "}
                {attacker.type2 && `/ ${attacker.type2}`}
              </p>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                <p>
                  HP: {attacker.hp} / 攻撃: {attacker.attack} / 防御:{" "}
                  {attacker.defense}
                </p>
                <p>
                  特攻: {attacker.spAttack} / 特防: {attacker.spDefense} /
                  素早さ: {attacker.speed}
                </p>
                <strong>合計種族値: {attacker.totalStats}</strong>
              </div>
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
          <PokemonSearch label="検索" onSelect={setDefender} />

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
                タイプ: {defender.type1}{" "}
                {defender.type2 && `/ ${defender.type2}`}
              </p>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                <p>
                  HP: {defender.hp} / 防御: {defender.defense} / 特防:{" "}
                  {defender.spDefense}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ここに将来「技の選択」や「計算ボタン」を追加します */}
    </main>
  );
}
