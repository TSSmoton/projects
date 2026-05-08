package com.example.demoapi.service;

import com.example.demoapi.entity.Move;
import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.MoveRepository;
import com.example.demoapi.repository.PokemonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * PokeAPIからポケモンのデータを取得し、日本語化してデータベースに保存するサービスクラス。
 */
@Service
public class PokemonImportService {

    @Autowired
    private PokemonRepository pokemonRepository;

    @Autowired
    private MoveRepository moveRepository;

    @Autowired  
    private RestTemplate restTemplate;

    // --- 【高速化の要】特性の日本語名を一時保存するキャッシュ ---
    // 同じ特性（例:「しんりょく」）を何度もAPIに問い合わせないようにするためのメモ帳です。
    private final Map<String, String> abilityCache = new HashMap<>();

    // 英語のタイプ名を日本語に変換するための辞書
    private static final Map<String, String> TYPE_MAP = Map.ofEntries(
        Map.entry("normal", "ノーマル"), Map.entry("fire", "ほのお"), Map.entry("water", "みず"),
        Map.entry("grass", "くさ"), Map.entry("electric", "でんき"), Map.entry("ice", "こおり"),
        Map.entry("fighting", "かくとう"), Map.entry("poison", "どく"), Map.entry("ground", "じめん"),
        Map.entry("flying", "ひこう"), Map.entry("psychic", "エスパー"), Map.entry("bug", "むし"),
        Map.entry("rock", "いわ"), Map.entry("ghost", "ゴースト"), Map.entry("dragon", "ドラゴン"),
        Map.entry("dark", "あく"), Map.entry("steel", "はがね"), Map.entry("fairy", "フェアリー")
    );

    /**
     * 指定された図鑑番号（startId 〜 endId）のポケモンと、その全フォルムを取得して保存します。
     */
    public void importWithVarieties(int startId, int endId) {
        for (int i = startId; i <= endId; i++) {
            try {
                // 1. まず「種族（Species）」の情報を取得し、基本の日本語名（例: フシギバナ）を得る
                String url = "https://pokeapi.co/api/v2/pokemon-species/" + i;
                Map<String, Object> speciesRes = restTemplate.getForObject(url, Map.class);
                String baseJpName = getJapaneseName(speciesRes);

                // 2. その種族が持つ「すべてのフォルム（メガシンカやアローラの姿など）」のリストを取得
                List<Map<String, Object>> varieties = (List<Map<String, Object>>) speciesRes.get("varieties");

                // 3. 各フォルムごとに詳細データを取得してDBに保存する
                for (Map<String, Object> v : varieties) {
                    Map<String, Object> pInfo = (Map<String, Object>) v.get("pokemon");
                    processAndSave(i, baseJpName, (String) pInfo.get("url"), (boolean) v.get("is_default"));
                }
            } catch (Exception e) {
                System.err.println("エラー (ID:" + i + "): " + e.getMessage());
            }
        }
    }

    /**
     * 1つのフォルム（個体）のデータをAPIから取得し、エンティティに変換して保存します。
     */
    private void processAndSave(Integer speciesId, String baseName, String url, boolean isDefault) {
        Map<String, Object> data = restTemplate.getForObject(url, Map.class);
        Integer id = (Integer) data.get("id");
        
        // デフォルトフォルムなら基本名（フシギバナ）、別フォルムなら名前を合成（メガフシギバナ）
        String enName = (String) data.get("name");
        String finalName = isDefault ? baseName : formatVariantName(baseName, enName);
        
        saveToDb(id, speciesId, finalName, data);
    }

    /**
     * 取得したJSONマップのデータをPokemonエンティティにマッピングしてDBに保存します。
     */
    private void saveToDb(Integer id, Integer speciesId, String name, Map<String, Object> pokeData) {
        Pokemon p = new Pokemon();
        p.setId(id);
        p.setSpeciesId(speciesId);
        p.setName(name);

        // --- 体重の変換 ---
        // PokeAPIのweightは「100グラム単位」で返ってくるため、10.0で割ってkgに直します。
        Integer weightRaw = (Integer) pokeData.get("weight");
        p.setWeight(weightRaw / 10.0);

        // --- タイプの抽出と翻訳 ---
        List<Map<String, Object>> types = (List<Map<String, Object>>) pokeData.get("types");
        p.setType1(translateType((Map<String, Object>) types.get(0).get("type")));
        if (types.size() > 1) {
            p.setType2(translateType((Map<String, Object>) types.get(1).get("type")));
        }

        // --- 特性の抽出と翻訳（キャッシュ利用） ---
        List<Map<String, Object>> abilities = (List<Map<String, Object>>) pokeData.get("abilities");
        for (Map<String, Object> ab : abilities) {
            Map<String, Object> detail = (Map<String, Object>) ab.get("ability");
            String abUrl = (String) detail.get("url"); // 特性詳細のURL
            boolean isHidden = (boolean) ab.get("is_hidden");
            int slot = (int) ab.get("slot");

            String jpAbilityName = getAbilityJapaneseName(abUrl);

            if (isHidden) p.setHiddenAbility(jpAbilityName);
            else if (slot == 1) p.setAbility1(jpAbilityName);
            else if (slot == 2) p.setAbility2(jpAbilityName);
        }

        // --- 種族値の抽出 ---
        List<Map<String, Object>> stats = (List<Map<String, Object>>) pokeData.get("stats");
        int hp = (Integer) stats.get(0).get("base_stat");
        int atk = (Integer) stats.get(1).get("base_stat");
        int def = (Integer) stats.get(2).get("base_stat");
        int spa = (Integer) stats.get(3).get("base_stat");
        int spd = (Integer) stats.get(4).get("base_stat");
        int spe = (Integer) stats.get(5).get("base_stat");

        p.setHp(hp); p.setAttack(atk); p.setDefense(def);
        p.setSpAttack(spa); p.setSpDefense(spd); p.setSpeed(spe);
        p.setTotalStats(hp + atk + def + spa + spd + spe);

        // --- 覚える技の解析（一括取得による超高速化） ---
        List<Map<String, Object>> movesList = (List<Map<String, Object>>) pokeData.get("moves");
        List<Integer> moveIds = new ArrayList<>(); 

        if (movesList != null) {
            for (Map<String, Object> moveEntry : movesList) {
                Map<String, Object> moveInfo = (Map<String, Object>) moveEntry.get("move");
                String moveUrl = (String) moveInfo.get("url"); // 例: https://pokeapi.co/api/v2/move/89/

                // URLの末尾から技ID（89）だけを切り出してリストに貯める
                String[] urlParts = moveUrl.split("/");
                try {
                    moveIds.add(Integer.parseInt(urlParts[urlParts.length - 1]));
                } catch (NumberFormatException e) {
                    System.err.println("技IDのパース失敗: " + moveUrl);
                }
            }
        }

        // 貯めた技IDを使って、DBから「一括で」技エンティティを取得して紐付ける
        List<Move> learnableMoves = moveRepository.findAllById(moveIds);
        p.setLearnableMoves(learnableMoves);

        pokemonRepository.save(p);
    }

    /**
     * 特性の日本語名を取得します。すでに取得済みの場合はキャッシュ（メモ）から返します。
     */
    private String getAbilityJapaneseName(String abilityUrl) {
        if (abilityCache.containsKey(abilityUrl)) {
            return abilityCache.get(abilityUrl);
        }
        try {
            Map<String, Object> res = restTemplate.getForObject(abilityUrl, Map.class);
            String jpName = getJapaneseName(res); 
            abilityCache.put(abilityUrl, jpName);
            return jpName;
        } catch (Exception e) {
            return "不明";
        }
    }

    private String translateType(Map<String, Object> typeInfo) {
        return TYPE_MAP.getOrDefault((String) typeInfo.get("name"), (String) typeInfo.get("name"));
    }

    /**
     * PokeAPIのレスポンス（複数言語の配列）から、日本語のテキストを探して返します。
     */
    private String getJapaneseName(Map<String, Object> response) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) response.get("names");
        // まず「ひらがな・カタカナ（ja-Hrkt）」を優先して探す
        for (Map<String, Object> nameEntry : names) {
            Map<String, Object> lang = (Map<String, Object>) nameEntry.get("language");
            if ("ja-Hrkt".equals(lang.get("name"))) return (String) nameEntry.get("name");
        }
        // なければ「漢字混じり（ja）」を探す
        for (Map<String, Object> nameEntry : names) {
            Map<String, Object> lang = (Map<String, Object>) nameEntry.get("language");
            if ("ja".equals(lang.get("name"))) return (String) nameEntry.get("name");
        }
        return "不明";
    }

    /**
     * 英語の接尾辞（-mega等）を判定し、正しい日本語のフォルム名に変換します。
     */
    private String formatVariantName(String baseName, String enName) {
        Map<String, String> suffixes = new LinkedHashMap<>();
        suffixes.put("-mega-x", "メガ" + baseName + "X");
        suffixes.put("-mega-y", "メガ" + baseName + "Y");
        suffixes.put("-mega-z", "メガ" + baseName + "Z");
        suffixes.put("-mega", "メガ" + baseName);
        suffixes.put("-hisui", baseName + "(ヒスイのすがた)");
        suffixes.put("-alola", baseName + "(アローラのすがた)");
        suffixes.put("-galar", baseName + "(ガラルのすがた)");
        suffixes.put("-paldea", baseName + "(パルデアのすがた)");
        
        for (Map.Entry<String, String> entry : suffixes.entrySet()) {
            if (enName.contains(entry.getKey())) return entry.getValue();
        }
        return baseName + "(" + enName + ")"; // 辞書にない特殊個体のフォールバック
    }
}