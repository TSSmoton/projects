"use client";
import React, { useState, useEffect, useRef } from "react";
// ✅ ここで api.ts から本物の関数を読み込む
import { getMovesByPokemonId } from "../services/api";

// 技のデータ型（バックエンドの Move.java の構造に合わせます）
interface Move {
  id: number;
  name: string;
  type: string;
  category: "物理" | "特殊" | "変化";
  power: number;
}

export default function MoveSearch({
  onSelect,
  selectedPokemonId, // 選ばれているポケモンのID
}: {
  onSelect: (move: Move) => void;
  selectedPokemonId?: number;
}) {
  const [query, setQuery] = useState("");
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]); // そのポケモンが覚える全技リスト
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]); // 絞り込み後のリスト
  const [isOpen, setIsOpen] = useState(false); // ドロップダウンの開閉状態
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // 「現在選択されているリストの項目」を記憶するための箱
  const selectedItemRef = useRef<HTMLLIElement | null>(null);

  // // selectedIndex が変わるたびに、その要素までスクロールする
  // useEffect(() => {
  //   if (selectedItemRef.current) {
  //     // block: "nearest" にすると、画面外に出た時だけ最小限のスクロールをしてくれます
  //     selectedItemRef.current.scrollIntoView({ block: "nearest" });
  //   }
  // }, [selectedIndex]);

  // ✅ ここがメイン！ポケモンが選ばれたら、DBから本物の技リストを取得する
  useEffect(() => {
    let isMounted = true; // 画面切り替え時のエラーを防ぐおまじない

    const fetchPokemonMoves = async () => {
      // ポケモンがまだ選ばれていなければ空っぽにする
      if (!selectedPokemonId) {
        if (isMounted) {
          setAvailableMoves([]);
          setFilteredMoves([]);
        }
        return;
      }

      // 💥 ダミーデータを消し、さっき作ったAPI関数でDBから本物のデータを取得！
      const data = await getMovesByPokemonId(selectedPokemonId);

      if (isMounted) {
        setAvailableMoves(data); // 取得した全技をセット
        setFilteredMoves(data); // 最初は絞り込みなし（全表示）
        setQuery(""); // 技の入力欄の文字をリセット
      }
    };

    fetchPokemonMoves();

    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, [selectedPokemonId]); // 👈 ポケモンが変更されるたびに、この処理が自動で走る

  // 外側をクリックしたらドロップダウンを閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0) {
      const activeItem = document.getElementById(`move-suggestion-${focusedIndex}`);
      activeItem?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  // 入力時のローカル絞り込み処理（爆速！）
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
    setIsOpen(true);

    if (val.length > 0) {
      // すでに取得済みの availableMoves の中から、文字が含まれるものだけを残す
      const filtered = availableMoves.filter((m) => m.name.includes(val));
      setFilteredMoves(filtered);
    } else {
      setFilteredMoves(availableMoves); // 空なら全表示に戻す
    }
  };

  // キーボード操作（上下キーとEnterで選べるようにする）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredMoves.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < filteredMoves.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredMoves.length) {
        handleSelect(filteredMoves[focusedIndex]);
      }
    }
  };

  // 技を決定した時の処理
  const handleSelect = (move: Move) => {
    onSelect(move);
    setQuery(move.name); // 選択した技名を入力欄に入れる
    setIsOpen(false); // ドロップダウンを閉じる
    setFocusedIndex(-1);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", marginTop: "10px" }}>
      <label style={{ fontSize: "0.8rem", display: "block" }}>使う技</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)} // クリックされたらバッと開く
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
              id={`move-suggestion-${index}`} // フォーカス管理のためのID
              onClick={() => handleSelect(m)}
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
