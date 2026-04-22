"use client";
import React, { useState } from "react";
import { searchMoves } from "../services/api";

export default function MoveSearch({
  onSelect,
}: {
  onSelect: (move: any) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 0) {
      const data = await searchMoves(val);
      setResults(data);
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ position: "relative", marginTop: "10px" }}>
      <label style={{ fontSize: "0.8rem", display: "block" }}>使う技</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder="10まんボルト..."
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
            zIndex: 110,
            listStyle: "none",
            padding: 0,
            maxHeight: "150px",
            overflowY: "auto",
            color: "black",
          }}
        >
          {results.map((m) => (
            <li
              key={m.id}
              onClick={() => {
                onSelect(m);
                setQuery(m.name);
                setResults([]);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {m.name} ({m.type} / {m.category})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
