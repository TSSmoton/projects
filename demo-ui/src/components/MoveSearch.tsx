"use client";
import React, { useState } from "react";
import { searchMoves } from "../services/api";

// 技の型定義（page.tsxと合わせるか、別途typesなどに切り出すと綺麗ですが、一旦ここで定義します）
interface Move {
  id: number;
  name: string;
  type: string;
  category: "物理" | "特殊" | "変化";
  power: number;
}

export default function MoveSearch({
  onSelect,
}: {
  onSelect: (move: Move) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Move[]>([]);
  // ✅ キーボードで選択中のインデックス
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1); // 入力が変わったら選択をリセット
    if (val.length > 0) {
      const data = await searchMoves(val);
      setResults(data);
    } else {
      setResults([]);
    }
  };

  // ✅ キーボード操作の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // フォーカスされている項目があれば決定する
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        const selected = results[focusedIndex];
        onSelect(selected);
        setQuery(selected.name);
        setResults([]);
        setFocusedIndex(-1);
      }
    }
  };

  return (
    <div style={{ position: "relative", marginTop: "10px" }}>
      <label style={{ fontSize: "0.8rem", display: "block" }}>使う技</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown} // ✅ キーボードイベントを追加
        placeholder="１０まんボルト..."
        style={{
          width: "95%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          color: "black",
        }}
      />
      {results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            zIndex: 110,
            listStyle: "none",
            padding: 0,
            maxHeight: "150px",
            overflowY: "auto",
            color: "black",
          }}
        >
          {results.map((m, index) => (
            <li
              key={m.id}
              onClick={() => {
                onSelect(m);
                setQuery(m.name);
                setResults([]);
                setFocusedIndex(-1);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                // ✅ フォーカスされている項目の背景色を変える
                backgroundColor: index === focusedIndex ? "#e0f2fe" : "white",
              }}
            >
              {/* 左側：名前とタイプ */}
              <div>
                <span style={{ fontWeight: "bold" }}>{m.name}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#666",
                    marginLeft: "5px",
                  }}
                >
                  ({m.type})
                </span>
              </div>

              {/* 右側：分類と威力 */}
              <div style={{ fontSize: "0.8rem", textAlign: "right" }}>
                <span
                  style={{
                    marginRight: "8px",
                    color:
                      m.category === "物理"
                        ? "#ff4d4d"
                        : m.category === "特殊"
                          ? "#4d79ff"
                          : "#888",
                    fontWeight: "bold",
                  }}
                >
                  {m.category}
                </span>
                <span style={{ color: "#333" }}>
                  威力: {m.power && m.power > 0 ? m.power : "—"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
