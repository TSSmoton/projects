"use client";

// ✅ 修正: useEffect をインポートに追加
import React, { useState, useEffect } from "react";
import { searchPokemon } from "../services/api";

// ※Pokemonの型定義がない場合は追加（すでに別ファイルで定義されていれば不要です）
interface Pokemon {
  id: number;
  name: string;
  // ... 他のプロパティ
}

interface PokemonSearchProps {
  label: string;
  onSelect: (pokemon: Pokemon) => void;
  // ✅ 追加: 親から「いま選ばれているポケモン」を受け取る
  selectedPokemon?: Pokemon | null;
}

// ✅ 修正: 引数に selectedPokemon を追加
export default function PokemonSearch({
  label,
  onSelect,
  selectedPokemon,
}: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // 💥 ここが一番重要！ 💥
  // 親コンポーネント（page.tsx）で「⇄」ボタンが押されて selectedPokemon が切り替わったら、
  // この中身が自動的に走って、テキストボックスの文字を新しいポケモンの名前に書き換えます。
// 💥 修正：同期的なState更新を避けるため、非同期関数でラップする
  useEffect(() => {
    let isMounted = true;

    const syncQuery = async () => {
      if (isMounted) {
        // selectedPokemon があればその名前を、なければ空文字をセット
        setQuery(selectedPokemon?.name || "");
      }
    };

    syncQuery();

    return () => {
      isMounted = false;
    };
  }, [selectedPokemon]);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        const selected = results[focusedIndex];
        onSelect(selected);
        setQuery(selected.name);
        setResults([]);
        setFocusedIndex(-1);
      }
    }
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
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
        onKeyDown={handleKeyDown}
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
