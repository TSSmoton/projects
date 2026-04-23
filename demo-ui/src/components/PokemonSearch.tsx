"use client";

import React, { useState } from "react";
import { searchPokemon } from "../services/api";

interface PokemonSearchProps {
  label: string;
  onSelect: (pokemon: Pokemon) => void;
}

export default function PokemonSearch({ label, onSelect }: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  // ✅ 追加：キーボードで選択中のインデックス（-1 は未選択）
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // ✅ 追加：キーボード操作の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault(); // 画面がスクロールするのを防ぐ
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // フォーカスされている項目があれば、それを決定する
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        const selected = results[focusedIndex];
        onSelect(selected);
        setQuery(selected.name);
        setResults([]);
        setFocusedIndex(-1); // リセット
      }
    }
  };

  // ✅ 既存の入力ハンドラ（文字が打ち直されたらフォーカスをリセットする処理を追加）
  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1); // 文字が入力されたら選択位置をリセット
    if (val.length > 0) {
      try {
        const data = await searchPokemon(val);
        setResults(data);
      } catch (err) {
        console.error("検索エラー:", err);
      }
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <p style={{ fontSize: "0.8rem", marginBottom: "4px" }}>{label}</p>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown} // ✅ 追加：キーボードイベントを紐付け
        placeholder={`${label}の名前...`}
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
            zIndex: 10,
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxHeight: "150px",
            overflowY: "auto",
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
                // ✅ 修正：現在フォーカスされている項目の背景色を少し濃くする
                backgroundColor: index === focusedIndex ? "#e0f2fe" : "white",
                color: "black",
              }}
            >
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
