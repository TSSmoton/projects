const API_BASE_URL = "http://localhost:8080/api";

// ポケモン検索用
export const searchPokemon = async (name: string) => {
  const response = await fetch(
    `${API_BASE_URL}/pokemon/search?name=${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

// 技検索用
export const searchMoves = async (name: string) => {
  const response = await fetch(
    `${API_BASE_URL}/move/search?name=${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};
// ✅ ポケモンIDから、そのポケモンが覚える技リストを取得する関数
export const getMovesByPokemonId = async (pokemonId: number) => {
  try {
    // Spring BootのAPIを叩く
    const response = await fetch(`${API_BASE_URL}/move/pokemon/${pokemonId}`);
    if (!response.ok) {
      throw new Error("技データの取得に失敗しました");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; // エラー時は空っぽのリストを返す
  }
};
