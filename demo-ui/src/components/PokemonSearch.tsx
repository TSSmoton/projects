"use client";

import React, { useState } from "react";
import { searchPokemon } from "../services/api";

interface PokemonSearchProps {
  label: string;
  onSelect: (pokemon: any) => void;
}

export default function PokemonSearch({ label, onSelect }: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
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
        placeholder="名前で検索..."
        style={{
          width: "100%",
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
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {results.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                onSelect(p);
                setQuery(p.name);
                setResults([]);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                color: "black",
              }}
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
