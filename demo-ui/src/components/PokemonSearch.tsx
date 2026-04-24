"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchPokemon } from "../services/api";

interface Pokemon {
  id: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  type1: string;
  type2?: string;
  ability1: string;
  ability2?: string | null;
  hiddenAbility?: string | null;
  weight?: number;
}

interface PokemonSearchProps {
  label: string;
  onSelect: (pokemon: Pokemon) => void;
  // 親から「いま選ばれているポケモン」を受け取る
  selectedPokemon?: Pokemon | null;
}

// ==========================================
// 🇺🇸 英語フォルム名 ➡️ 🇯🇵 日本語への翻訳辞書
// ==========================================
const FORM_DICTIONARY: Record<string, string> = {
  // --- 基本・メガ・キョダイ ---
  mega: "メガシンカ",
  "mega-x": "メガX",
  "mega-y": "メガY",
  gmax: "キョダイマックス",
  primal: "げんしかいき",

  // --- 地方フォルム（リージョン） ---
  alola: "アローラのすがた",
  galar: "ガラルのすがた",
  hisui: "ヒスイのすがた",
  paldea: "パルデアのすがた",

  // --- 特殊個体（ご指名のもの） ---
  ash: "サトシゲッコウガ",
  eternal: "えいえんのはな",
  totem: "ぬしポケモン",

  // --- フォルムチェンジ系（世代順・主要どころ） ---
  attack: "アタックフォルム",
  defense: "ディフェンスフォルム",
  speed: "スピードフォルム",
  sandy: "すなちのミノ",
  trash: "ゴミのミノ",
  heat: "ヒートロトム",
  wash: "ウォッシュロトム",
  frost: "フロストロトム",
  fan: "スピンロトム",
  mow: "カットロトム",
  origin: "オリジンフォルム",
  sky: "スカイフォルム",
  zen: "ダルマモード",
  therian: "れいじゅうフォルム",
  incarnate: "けしんフォルム",
  resolute: "かくごのすがた",
  pirouette: "ステップフォルム",
  black: "ブラックキュレム",
  white: "ホワイトキュレム",
  active: "アクティブモード", // ゼルネアス
  small: "ちいさいサイズ",
  large: "おおきいサイズ",
  super: "とくだいサイズ",
  unbound: "ときはなたれしフーパ",
  baile: "めらめらスタイル",
  "pom-pom": "ぱちぱちスタイル",
  pau: "ふらふらスタイル",
  sensu: "まいまいスタイル",
  midday: "まひるのすがた",
  midnight: "まよなかのすがた",
  dusk: "たそがれのすがた",
  school: "ぎょぐんのすがた",
  meteor: "りゅうせいのすがた",
  core: "コアのすがた",
  busted: "ばけたすがた",
  original: "しんさくフォルム", // ヤバチャ等
  amped: "ハイなすがた",
  "low-key": "ローなすがた",
  "ice-face": "アイスフェイス",
  "no-ice": "ナイスフェイス",
  "full-belly": "まんぷくもよう",
  hangry: "はらぺこもよう",
  "rapid-strike": "れんげきのかた",
  "single-strike": "いちげきのかた",
  crowned: "けんのおう",
  "crowned-shield": "たてのおう",
  eternamax: "ムゲンダイマックス",
  "ice-rider": "はくばじょうのすがた",
  "shadow-rider": "こくばじょうのすがた",
  hero: "ヒーローフォルム", // イルカマン
  "three-segment": "みつふしフォルム", // ノココッチ
  droopy: "たれたすがた", // シャリタツ
  stretchy: "のびたすがた",
  curly: "そったすがた",
  "wellspring-mask": "いどのめん", // オーガポン
  "hearthflame-mask": "かまどのめん",
  "cornerstone-mask": "いしずえのめん",
  terastal: "テラスタルフォルム", // テラパゴス
  stellar: "ステラフォルム",

  // --- おきがえ・特殊もよう ---
  "rock-star": "ハードロック",
  belle: "マダム",
  "pop-star": "アイドル",
  phd: "ドクター",
  libre: "マスクド",
  cosplay: "おきがえ",

  // --- ピカチュウの帽子シリーズ（サトシのピカチュウ） ---
  "original-cap": "オリジナルキャップ",
  "hoenn-cap": "ホウエンキャップ",
  "sinnoh-cap": "シンオウキャップ",
  "unova-cap": "イッシュキャップ",
  "kalos-cap": "カロスキャップ",
  "alola-cap": "アローラキャップ",
  "partner-cap": "キミにきめたキャップ",
  "world-cap": "ワールドキャップ",

  // --- ピカチュウ・イーブイの相棒 ---
  starter: "相棒",

  // --- ゲッコウガ・その他 ---
  "battle-bond": "きずなへんげ", // 変身前のゲッコウガ
  "own-tempo": "マイペース", // イワンコ（たそがれ進化用）
};

// ==========================================
// 文字列を綺麗に和訳するフィルター関数
// ==========================================
const translateFormName = (rawName: string): string => {
  // 「ピカチュウ(pikachu-rock-star)」のような形式かチェック
  const match = rawName.match(/^(.*?)\((.*?)\)$/);
  if (!match) return rawName; // カッコがなければそのまま（例: ガブリアス）

  const jpName = match[1]; // "ピカチュウ"
  const enForm = match[2]; // "pikachu-rock-star"

  // PokeAPIの英語名は「(英語のポケモン名)-(フォルム名)」なので、
  // ハイフンで切って最初の単語（pikachu等）を捨てる
  const parts = enForm.split("-");
  parts.shift();
  const formKey = parts.join("-"); // "rock-star" や "mega-x" になる

  const translated = FORM_DICTIONARY[formKey];

  if (translated) {
    // 辞書にあれば和訳する
    return `${jpName} (${translated})`;
  } else if (formKey) {
    // 辞書にない場合でも「極論、英語は出したくない」という要望に合わせて、英語を隠す
    return `${jpName} (特殊なすがた)`;
  } else {
    return jpName;
  }
};

export default function PokemonSearch({
  label,
  onSelect,
  selectedPokemon,
}: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // ★追加1：ドロップダウンの開閉状態を管理するState
  const [isOpen, setIsOpen] = useState(false);

  // ★追加2：コンポーネントの外側クリックを検知するためのRef
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ★亡霊対策1：検索の「整理券番号」を管理する変数
  const searchTicket = useRef(0);
  useEffect(() => {
    let isMounted = true;
    const syncQuery = async () => {
      if (isMounted) {
        setQuery(selectedPokemon?.name || "");
        // 親から新しいポケモンが渡ってきたら（＝入れ替えなどが起きたら）、
        // 残っている検索結果の亡霊を消し去る！
        setResults([]);
        setIsOpen(false);
      }
    };
    syncQuery();
    return () => {
      isMounted = false;
    };
  }, [selectedPokemon]);

  // ★追加3：外側クリックでドロップダウンを閉じる処理（バグ2の修正）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // クリックした場所(e.target)が、wrapperRefの中になければ閉じる
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // 画面全体にクリックの監視を付ける
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ★ isOpenがfalseの時はキーボード操作を無視する
    if (!isOpen || results.length === 0) return;

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
        setIsOpen(false); // ★ 選択完了したら確実に閉じる

        // ★亡霊対策2：決定した瞬間に整理券の番号を進める（裏で待っている古い通信を無効化）
        searchTicket.current += 1;
      }
    }
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
    setIsOpen(true); // ★ 文字が入力されたらドロップダウンを開く

    // ★亡霊対策3：文字を打つたびに整理券を発行して番号を控える
    const currentTicket = ++searchTicket.current;

    if (val.length > 0) {
      try {
        const data = await searchPokemon(val);
        // ★ バグ1の対策：
        // APIからデータが返ってきた時、ユーザーがすでに決定ボタン(Enter)を押して
        // isOpenがfalseになっていれば、裏でresultsがセットされても画面には出ない。
        // ★亡霊対策4：データが返ってきた時、自分の整理券が「最新」の時だけ画面に出す！
        if (currentTicket === searchTicket.current) {
          setResults(data);
        }
      } catch (err) {
        console.error("検索エラー:", err);
      }
    } else {
      setResults([]);
    }
  };

  return (
    // ★追加2のRefを一番外側のdivにセット
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <p style={{ fontSize: "0.8rem", marginBottom: "4px" }}>{label}</p>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)} // ★ 入力欄をクリック（フォーカス）したら開く
        placeholder={`${label}の名前...`}
        style={{
          width: "95%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          color: "black",
        }}
      />

      {/* ★ isOpen が true の時だけ <ul> を表示するように条件を追加 */}
      {isOpen && results.length > 0 && (
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
                setQuery(translateFormName(m.name)); // 検索窓に入る文字も綺麗にする！
                setResults([]);
                setFocusedIndex(-1);
                setIsOpen(false); // ★ クリックで選択した時も確実に閉じる
                searchTicket.current += 1;
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                backgroundColor: index === focusedIndex ? "#e0f2fe" : "white",
                color: "black",
              }}
            >
              {translateFormName(m.name)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
