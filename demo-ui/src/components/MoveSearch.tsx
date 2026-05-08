"use client";
import React, { useState, useEffect, useRef } from "react";
import { getMovesByPokemonId, searchMoves } from "../services/api";

// 💡 バックエンドのMoveエンティティに合わせた型定義
// 親のHome.tsxで表示や計算に使うため、accuracyとeffectも持たせておきます
export interface Move {
  id: number;
  name: string;
  type: string;
  category: "物理" | "特殊" | "変化";
  power: number;
  accuracy?: number; 
  effect?: string;   
}

interface MoveSearchProps {
  onSelect: (move: Move) => void;
  selectedPokemonId?: number; // 今選ばれているポケモンのID
}

export default function MoveSearch({ onSelect, selectedPokemonId }: MoveSearchProps) {
  const [query, setQuery] = useState("");
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. ポケモンが選択されたら、そのポケモンが覚える全技を取得する
  useEffect(() => {
    let isMounted = true;

    const fetchPokemonMoves = async () => {
      if (!selectedPokemonId) {
        if (isMounted) {
          setAvailableMoves([]);
          setFilteredMoves([]);
        }
        return;
      }

      const data = await getMovesByPokemonId(selectedPokemonId);
      if (isMounted) {
        setAvailableMoves(data);
        setFilteredMoves(data);
        setQuery(""); // 新しいポケモンになったら技の入力をリセット
      }
    };

    fetchPokemonMoves();
    return () => { isMounted = false; };
  }, [selectedPokemonId]);

  // 2. 外側クリックでドロップダウンを閉じる処理
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. キーボード操作でのスクロール追従処理
  useEffect(() => {
    if (focusedIndex >= 0) {
      const activeItem = document.getElementById(`move-suggestion-${focusedIndex}`);
      activeItem?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  // ----------------------------------------------------
  // 💡 【追加】決定時の共通ロジック（重複コードの排除）
  // ----------------------------------------------------
  const handleDecide = (move: Move) => {
    onSelect(move);
    setQuery(move.name);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // 手入力してEnterを押した時の「データベース全検索からの強制セット」機能
  const handleManualSubmit = async (inputText: string) => {
    // まずは「覚える技」の中に完全一致がないか探す
    const localMatch = availableMoves.find((m) => m.name === inputText);
    if (localMatch) {
      handleDecide(localMatch);
      return;
    }

    // なければAPI経由で全技データベースから探す
    try {
      const results = await searchMoves(inputText);
      // APIがオブジェクト1件だけを返してきた場合でも、findを使えるように配列化する安全策
      const resultsArray = Array.isArray(results) ? results : [results];
      const exactMatch = resultsArray.find((m: Move) => m && m.name === inputText);
      
      if (exactMatch) {
        handleDecide(exactMatch);
      } else {
        alert(`「${inputText}」という技はデータベースに見つかりませんでした。`);
      }
    } catch (error) {
      console.error(error);
      alert("技データの取得に失敗しました。（通信エラー等の可能性があります）");
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
    setIsOpen(true);

    if (val.length > 0) {
      // 技の場合はすでにDBから覚えるリストを全件取得してあるので、通信はせずにローカルで超高速絞り込み
      const filtered = availableMoves.filter((m) => m.name.includes(val));
      setFilteredMoves(filtered);
    } else {
      setFilteredMoves(availableMoves);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query.trim().length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isOpen && filteredMoves.length > 0) {
        setFocusedIndex((prev) => prev < filteredMoves.length - 1 ? prev + 1 : prev);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen && filteredMoves.length > 0) {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && focusedIndex < filteredMoves.length) {
        // サジェストを選んでいる場合
        handleDecide(filteredMoves[focusedIndex]);
      } else {
        // サジェストを選ばずに、直接文字を打ってEnterを押した場合
        handleManualSubmit(query.trim());
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", marginTop: "10px" }}>
      <label style={{ fontSize: "0.8rem", display: "block" }}>使う技</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder="文字を入力して絞り込み..."
        style={{
          width: "95%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          color: "black",
        }}
      />
      
      {isOpen && filteredMoves.length > 0 && (
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
            maxHeight: "200px",
            overflowY: "auto",
            color: "black",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {filteredMoves.map((m, index) => (
            <li
              key={m.id}
              id={`move-suggestion-${index}`}
              onClick={() => handleDecide(m)} // 共通関数を呼び出す
              style={{
                padding: "10px 8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: index === focusedIndex ? "#e0f2fe" : "white",
              }}
            >
              <div>
                <span style={{ fontWeight: "bold" }}>{m.name}</span>
                <span style={{ fontSize: "0.7rem", color: "#666", marginLeft: "5px" }}>
                  ({m.type})
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", textAlign: "right" }}>
                <span
                  style={{
                    marginRight: "8px",
                    color: m.category === "物理" ? "#ff4d4d" : m.category === "特殊" ? "#4d79ff" : "#888",
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