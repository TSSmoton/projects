package com.example.demoapi.service;

import com.example.demoapi.entity.Pokemon;
import com.example.demoapi.repository.PokemonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import com.example.demoapi.entity.Move;
import com.example.demoapi.repository.MoveRepository;

@Service
public class PokemonImportService {

    @Autowired
    private PokemonRepository pokemonRepository;

    @Autowired
    private MoveRepository moveRepository;

    @Autowired  
    private RestTemplate restTemplate;

    // --- 【新兵器】特性の日本語名を一時保存するメモ帳（キャッシュ） ---
    // これにより、同じ特性を何度もネットで調べなくて済むようになります。
    private final Map<String, String> abilityCache = new HashMap<>();

    private static final Map<String, String> TYPE_MAP = Map.ofEntries(
        Map.entry("normal", "ノーマル"), Map.entry("fire", "ほのお"), Map.entry("water", "みず"),
        Map.entry("grass", "くさ"), Map.entry("electric", "でんき"), Map.entry("ice", "こおり"),
        Map.entry("fighting", "かくとう"), Map.entry("poison", "どく"), Map.entry("ground", "じめん"),
        Map.entry("flying", "ひこう"), Map.entry("psychic", "エスパー"), Map.entry("bug", "むし"),
        Map.entry("rock", "いわ"), Map.entry("ghost", "ゴースト"), Map.entry("dragon", "ドラゴン"),
        Map.entry("dark", "あく"), Map.entry("steel", "はがね"), Map.entry("fairy", "フェアリー")
    );

    public void importWithVarieties(int startId, int endId) {
        for (int i = startId; i <= endId; i++) {
            try {
                String url = "https://pokeapi.co/api/v2/pokemon-species/" + i;
                Map<String, Object> speciesRes = restTemplate.getForObject(url, Map.class);
                String baseJpName = getJapaneseName(speciesRes);

                List<Map<String, Object>> varieties = (List<Map<String, Object>>) speciesRes.get("varieties");
                // for (Map<String, Object> v : varieties) {
                //     Map<String, Object> pInfo = (Map<String, Object>) v.get("pokemon");
                //     processAndSave(baseJpName, (String) pInfo.get("url"), (boolean) v.get("is_default"));
                // }

                for (Map<String, Object> v : varieties) {
                    Map<String, Object> pInfo = (Map<String, Object>) v.get("pokemon");
                    processAndSave(i, baseJpName, (String) pInfo.get("url"), (boolean) v.get("is_default"));
                }
            } catch (Exception e) {
                System.err.println("エラー (ID:" + i + "): " + e.getMessage());
            }
        }
    }

    // private void processAndSave(String baseName, String url, boolean isDefault) {
    //     Map<String, Object> data = restTemplate.getForObject(url, Map.class);
    //     Integer id = (Integer) data.get("id");
    //     String enName = (String) data.get("name");
    //     String finalName = isDefault ? baseName : formatVariantName(baseName, enName);

    //     saveToDb(id, finalName, data);
    //     System.out.println("インポート成功: " + finalName + " (ID:" + id + ")");
    // }


    // 個別処理
    private void processAndSave(Integer speciesId, String baseName, String url, boolean isDefault) {
        Map<String, Object> data = restTemplate.getForObject(url, Map.class);
        Integer id = (Integer) data.get("id");
        // ... (名前の決定ロジック) ...
        String enName = (String) data.get("name");
        String finalName = isDefault ? baseName : formatVariantName(baseName, enName);
        // saveToDbに speciesId も渡す
        saveToDb(id, speciesId, finalName, data);
    }

    // private void saveToDb(Integer id, String name, Map<String, Object> pokeData) {
    //     Pokemon p = new Pokemon();
    //     p.setId(id);
    //     p.setName(name);
    private void saveToDb(Integer id, Integer speciesId, String name, Map<String, Object> pokeData) {
        Pokemon p = new Pokemon();
        p.setId(id);
        p.setSpeciesId(speciesId); // ここでセット！
        p.setName(name);
        // --- 体重の抽出（100g単位をkgに変換） ---
        // pokeData.get("weight") は Integer で返ってくるので、10.0 で割って Double にします
        Integer weightRaw = (Integer) pokeData.get("weight");
        p.setWeight(weightRaw / 10.0);


        // タイプ解析
        List<Map<String, Object>> types = (List<Map<String, Object>>) pokeData.get("types");
        p.setType1(translateType((Map<String, Object>) types.get(0).get("type")));
        if (types.size() > 1) {
            p.setType2(translateType((Map<String, Object>) types.get(1).get("type")));
        }

        // --- 特性解析（日本語化対応版） ---
        List<Map<String, Object>> abilities = (List<Map<String, Object>>) pokeData.get("abilities");
        for (Map<String, Object> ab : abilities) {
            Map<String, Object> detail = (Map<String, Object>) ab.get("ability");
            String abUrl = (String) detail.get("url"); // 特性詳細のURL
            boolean isHidden = (boolean) ab.get("is_hidden");
            int slot = (int) ab.get("slot");

            // 特性の日本語名をキャッシュ経由で取得
            String jpAbilityName = getAbilityJapaneseName(abUrl);

            if (isHidden) p.setHiddenAbility(jpAbilityName);
            else if (slot == 1) p.setAbility1(jpAbilityName);
            else if (slot == 2) p.setAbility2(jpAbilityName);
        }

        // ステータス解析
        List<Map<String, Object>> stats = (List<Map<String, Object>>) pokeData.get("stats");
        int hp = (Integer) stats.get(0).get("base_stat");
        int atk = (Integer) stats.get(1).get("base_stat");
        int def = (Integer) stats.get(2).get("base_stat");
        int spa = (Integer) stats.get(3).get("base_stat");
        int spd = (Integer) stats.get(4).get("base_stat");
        int spe = (Integer) stats.get(5).get("base_stat");

        p.setHp(hp);
        p.setAttack(atk);
        p.setDefense(def);
        p.setSpAttack(spa);
        p.setSpDefense(spd);
        p.setSpeed(spe);

        // 全てを足して「合計種族値」としてセット！
        p.setTotalStats(hp + atk + def + spa + spd + spe);

        // --- 覚える技の解析 ---
        List<Map<String, Object>> movesList = (List<Map<String, Object>>) pokeData.get("moves");
        List<Integer> moveIds = new ArrayList<>(); // 技IDだけを一旦集めるリスト

        if (movesList != null) {
            for (Map<String, Object> moveEntry : movesList) {
                Map<String, Object> moveInfo = (Map<String, Object>) moveEntry.get("move");
                String moveUrl = (String) moveInfo.get("url"); // 例: https://pokeapi.co/api/v2/move/89/

                // URLから技IDを抽出
                String[] urlParts = moveUrl.split("/");
                try {
                    Integer moveId = Integer.parseInt(urlParts[urlParts.length - 1]);
                    moveIds.add(moveId); // IDだけをリストに貯める
                } catch (NumberFormatException e) {
                    System.err.println("技IDのパースに失敗しました: " + moveUrl);
                }
            }
        }

        // 貯めた技IDを使って、DBから「一括で」技エンティティを取得（超高速化！）
        List<Move> learnableMoves = moveRepository.findAllById(moveIds);
        p.setLearnableMoves(learnableMoves);

        pokemonRepository.save(p);
    }

    /**
     * 【新設】特性の日本語名を取得するメソッド
     * キャッシュにあればそれを返し、なければAPIを叩いて調べます。
     */
    private String getAbilityJapaneseName(String abilityUrl) {
        // 1. すでに調べたことがあれば、その結果を返す（APIを叩かない！）
        if (abilityCache.containsKey(abilityUrl)) {
            return abilityCache.get(abilityUrl);
        }

        // 2. 初めて見る特性なら、APIにアクセスして調べる
        try {
            Map<String, Object> res = restTemplate.getForObject(abilityUrl, Map.class);
            String jpName = getJapaneseName(res); // すでにある日本語抽出メソッドを再利用
            
            // 3. 調べた結果をメモ（キャッシュ）しておく
            abilityCache.put(abilityUrl, jpName);
            return jpName;
        } catch (Exception e) {
            return "不明";
        }
    }

    private String translateType(Map<String, Object> typeInfo) {
        return TYPE_MAP.getOrDefault((String) typeInfo.get("name"), (String) typeInfo.get("name"));
    }

    private String getJapaneseName(Map<String, Object> response) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) response.get("names");
        for (Map<String, Object> nameEntry : names) {
            Map<String, Object> lang = (Map<String, Object>) nameEntry.get("language");
            if ("ja-Hrkt".equals(lang.get("name"))) return (String) nameEntry.get("name");
        }
        for (Map<String, Object> nameEntry : names) {
            Map<String, Object> lang = (Map<String, Object>) nameEntry.get("language");
            if ("ja".equals(lang.get("name"))) return (String) nameEntry.get("name");
        }
        return "不明";
    }

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
        return baseName + "(" + enName + ")";
    }
}