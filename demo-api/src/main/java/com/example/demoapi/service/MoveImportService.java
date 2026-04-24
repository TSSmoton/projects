package com.example.demoapi.service;

import com.example.demoapi.entity.Move;
import com.example.demoapi.repository.MoveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class MoveImportService {

    @Autowired
    private MoveRepository moveRepository;
    @Autowired
    private RestTemplate restTemplate;

    // タイプ変換マップ（ポケモンと共通）
    private static final Map<String, String> TYPE_MAP = Map.ofEntries(
        Map.entry("normal", "ノーマル"), Map.entry("fire", "ほのお"), Map.entry("water", "みず"),
        Map.entry("grass", "くさ"), Map.entry("electric", "でんき"), Map.entry("ice", "こおり"),
        Map.entry("fighting", "かくとう"), Map.entry("poison", "どく"), Map.entry("ground", "じめん"),
        Map.entry("flying", "ひこう"), Map.entry("psychic", "エスパー"), Map.entry("bug", "むし"),
        Map.entry("rock", "いわ"), Map.entry("ghost", "ゴースト"), Map.entry("dragon", "ドラゴン"),
        Map.entry("dark", "あく"), Map.entry("steel", "はがね"), Map.entry("fairy", "フェアリー")
    );
    private static final Map<String, String> CATEGORY_MAP = Map.of(
        "physical", "物理",
        "special", "特殊",
        "status", "変化"
    );

public void importMoves(int startId, int endId) {
        for (int i = startId; i <= endId; i++) {
            try {
                String url = "https://pokeapi.co/api/v2/move/" + i;
                Map<String, Object> res = restTemplate.getForObject(url, Map.class);

                Move m = new Move();
                m.setId((Integer) res.get("id"));
                m.setName(getJapaneseName(res, "names"));
                m.setType(TYPE_MAP.getOrDefault((String) ((Map) res.get("type")).get("name"), "不明"));
                
                // --- カテゴリを日本語化 ---
                String enCat = (String) ((Map) res.get("damage_class")).get("name");
                m.setCategory(CATEGORY_MAP.getOrDefault(enCat, enCat));

                m.setPower((Integer) res.get("power"));
                m.setAccuracy((Integer) res.get("accuracy"));

                // --- 説明文を取得し、改行を掃除する ---
                String rawEffect = getJapaneseName(res, "flavor_text_entries");
                m.setEffect(cleanText(rawEffect));

                moveRepository.save(m);
                System.out.println("技インポート成功: " + m.getName() + " [" + m.getCategory() + "]");
            } catch (Exception e) {
                System.err.println("技エラー (ID:" + i + "): " + e.getMessage());
            }
        }
    }

    // 改行やページ送り文字を消し去る魔法 ---
    private String cleanText(String text) {
        if (text == null) return "";
        return text.replace("\n", "") // 普通の改行を消す
                   .replace("\f", "") // ページ送り（変な四角い文字の原因）を消す
                   .replace("\r", ""); // Windows系の改行を念のため消す
    }

    private String getJapaneseName(Map<String, Object> res, String key) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) res.get(key);
        for (Map<String, Object> entry : entries) {
            Map<String, Object> lang = (Map<String, Object>) entry.get("language");
            if ("ja-Hrkt".equals(lang.get("name")) || "ja".equals(lang.get("name"))) {
                return (String) (entry.containsKey("name") ? entry.get("name") : entry.get("flavor_text"));
            }
        }
        return "不明";
    }
}