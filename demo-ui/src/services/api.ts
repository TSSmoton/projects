// 開発中（localhost）と本番環境（Render等のクラウド）で、通信先のURLを自動で切り替える設定
const API_BASE_URL = process.env.NODE_ENV === "production" 
  ? "https://projects-cskf.onrender.com/api"
  : "http://localhost:8080/api";

/**
 * データベースからポケモンの名前であいまい検索を行います。
 * @param name 検索したいポケモン名（例: "フシギ"）
 * @returns 一致したポケモンの配列
 */
export const searchPokemon = async (name: string) => {
  const response = await fetch(
    `${API_BASE_URL}/pokemon/search?name=${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("ポケモンの検索に失敗しました");
  return response.json();
};

/**
 * データベースから技の名前であいまい検索を行います。
 * @param name 検索したい技名（例: "じしん"）
 * @returns 一致した技の配列
 */
export const searchMoves = async (name: string) => {
  const response = await fetch(
    `${API_BASE_URL}/move/search?name=${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("技の検索に失敗しました");
  return response.json();
};

/**
 * 指定したポケモンのIDから、そのポケモンが覚える「すべての技」を取得します。
 * @param pokemonId 技を取得したいポケモンのID
 * @returns そのポケモンが覚える技の配列（エラー時は空配列）
 */
export const getMovesByPokemonId = async (pokemonId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/move/pokemon/${pokemonId}`);
    if (!response.ok) {
      throw new Error("技データの取得に失敗しました");
    }
    return await response.json();
  } catch (error) {
    console.error("APIエラー:", error);
    return []; // 画面をクラッシュさせないための安全策
  }
};