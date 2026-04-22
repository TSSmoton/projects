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
