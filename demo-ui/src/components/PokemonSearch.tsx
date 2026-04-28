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
// 文字列を綺麗に和訳するフィルター関数（英語 ➡️ 日本語）
// ==========================================
const translateFormName = (rawName: string): string => {
  const match = rawName.match(/^(.*?)\s*[(（](.*?)[)）]$/);
  if (!match) return rawName;

  const jpName = match[1].trim();
  const enFull = match[2].trim();

  const parts = enFull.split("-");
  if (parts.length > 1) {
    parts.shift();
  }
  const formKey = parts.join("-");
  
  let translated = FORM_DICTIONARY[formKey];

  if (!translated) {
    for (const key in FORM_DICTIONARY) {
      if (formKey.includes(key)) {
        translated = FORM_DICTIONARY[key];
        break;
      }
    }
  }

  if (translated) {
    return `${jpName} (${translated})`;
  } else if (formKey) {
    return `${jpName} (${formKey})`;
  } else {
    return jpName;
  }
};

// ==========================================
// 🔍 検索入力の逆翻訳フィルター（日本語 ➡️ 英語）
// ==========================================
const convertQueryForAPI = (userInput: string): string => {
  let apiQuery = userInput;

  // DBがおそらく日本語に対応しておらず、英語で探す必要がある「特殊なフォルム」だけをリストアップ
  const SPECIFIC_REVERSE_DICT: Record<string, string> = {
    "きずな": "battle-bond",
    "きずなへんげ": "battle-bond",
    "サトシ": "ash",
    "サトシゲッコウガ": "ash",
    "マイペース": "own-tempo",
    "ハード": "rock-star",
    "ハードロック": "rock-star",
    "マダム": "belle",
    "アイドル": "pop-star",
    "ドクター": "phd",
    "マスクド": "libre",
    "おきがえ": "cosplay",
    "オリジナル": "original-cap",
    "オリジナルキャップ": "original-cap",
    "ホウエン": "hoenn-cap",
    "ホウエンキャップ": "hoenn-cap",
    "シンオウ": "sinnoh-cap",
    "シンオウキャップ": "sinnoh-cap",
    "イッシュ": "unova-cap",
    "イッシュキャップ": "unova-cap",
    "カロス": "kalos-cap",
    "カロスキャップ": "kalos-cap",
    "アローラ": "alola-cap",
    "アローラキャップ": "alola-cap",
    "キミにきめた": "partner-cap",
    "キミにきめたキャップ": "partner-cap",
    "ワールド": "world-cap",
    "ワールドキャップ": "world-cap",
    "相棒": "starter",
  };

  // 上のリストにある言葉が入力された時"だけ"、裏で英語に変換する
  for (const [jp, en] of Object.entries(SPECIFIC_REVERSE_DICT)) {
    if (apiQuery.includes(jp)) {
      apiQuery = apiQuery.replace(jp, en);
    }
  }

  return apiQuery;
};

export default function PokemonSearch({
  label,
  onSelect,
  selectedPokemon,
}: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTicket = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const syncQuery = async () => {
      if (isMounted) {
        setQuery(selectedPokemon ? translateFormName(selectedPokemon.name) : "");
        setResults([]);
        setIsOpen(false);
      }
    };
    syncQuery();
    return () => {
      isMounted = false;
    };
  }, [selectedPokemon]);

useEffect(() => {
  if (focusedIndex >= 0) {
    const activeItem = document.getElementById(`suggestion-${focusedIndex}`);
    activeItem?.scrollIntoView({ block: "nearest" });
  }
}, [focusedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        
        // ★修正ポイント：親に渡す段階で、データの中身ごと和訳してしまう！
        const translatedPokemon = { ...selected, name: translateFormName(selected.name) };

        onSelect(translatedPokemon);
        setQuery(translatedPokemon.name);
        setResults([]);
        setFocusedIndex(-1);
        setIsOpen(false);
        searchTicket.current += 1;
      }
    }
  };

// ★追加：タイマーを記憶するための変数（useStateの下あたりに追加）
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------
  // handleInputを丸ごとこれに差し替え！
  // ----------------------------------------------------
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
    setIsOpen(true);

    // ★魔法：入力があるたびに、前のタイマーをキャンセルする（連打防止）
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    if (val.length > 0) {
      // ★魔法：ユーザーが「0.3秒間」入力を止めたら、初めてAPIを叩く
      typingTimer.current = setTimeout(async () => {
        const currentTicket = ++searchTicket.current;
        const apiSearchTerm = convertQueryForAPI(val); // 逆翻訳

        try {
          const data = await searchPokemon(apiSearchTerm);
          if (currentTicket === searchTicket.current) {
            setResults(data);
          }
        } catch (err) {
          console.error("検索エラー:", err);
        }
      }, 300); // 300ミリ秒（0.3秒）待つ
    } else {
      setResults([]);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <p style={{ fontSize: "0.8rem", marginBottom: "4px" }}>{label}</p>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={`${label}の名前...`}
        style={{
          width: "95%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          color: "black",
        }}
      />

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
              id={`suggestion-${index}`} // フォーカス管理のためのID
              onClick={() => {
                // ★修正ポイント：親に渡す段階で、データの中身ごと和訳してしまう！
                const translatedPokemon = { ...m, name: translateFormName(m.name) };

                onSelect(translatedPokemon);
                setQuery(translatedPokemon.name);
                setResults([]);
                setFocusedIndex(-1);
                setIsOpen(false);
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