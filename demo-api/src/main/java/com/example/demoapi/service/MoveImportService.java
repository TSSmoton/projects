package com.example.demoapi.service;

import com.example.demoapi.entity.Move;
import com.example.demoapi.repository.MoveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

/**
 * PokeAPIからポケモンの「技」データを取得し、日本語化してDBに保存するサービスクラス。
 */
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

    // 技の分類（ダメージクラス）の変換マップ
    private static final Map<String, String> CATEGORY_MAP = Map.of(
        "physical", "物理",
        "special", "特殊",
        "status", "変化"
    );

    /**
     * 指定されたID範囲の技を取得し、保存します。
     * （※ポケモンをインポートする「前」に、必ず技をインポートしておく必要があります）
     */
    public void importMoves(int startId, int endId) {
        for (int i = startId; i <= endId; i++) {
            try {
                String url = "https://pokeapi.co/api/v2/move/" + i;
                Map<String, Object> res = restTemplate.getForObject(url, Map.class);

                Move m = new Move();
                m.setId((Integer) res.get("id"));
                m.setName(getJapaneseName(res, "names"));
                m.setType(TYPE_MAP.getOrDefault((String) ((Map) res.get("type")).get("name"), "不明"));
                
                // --- カテゴリ（物理・特殊・変化）の翻訳 ---
                String enCat = (String) ((Map) res.get("damage_class")).get("name");
                m.setCategory(CATEGORY_MAP.getOrDefault(enCat, enCat));

                m.setPower((Integer) res.get("power"));
                m.setAccuracy((Integer) res.get("accuracy"));

                // --- 技の説明文を取得し、ゲーム特有の改行コードを掃除する ---
                String rawEffect = getJapaneseName(res, "flavor_text_entries");
                m.setEffect(cleanText(rawEffect));

                moveRepository.save(m);
                System.out.println("技インポート成功: " + m.getName() + " [" + m.getCategory() + "]");
            } catch (Exception e) {
                // 欠番の技ID（抜け番）などを踏んだ場合はエラーになるためスキップして次へ
                System.err.println("技エラー (ID:" + i + "): " + e.getMessage());
            }
        }
    }

    /**
     * PokeAPIから返ってくるゲーム内のテキストデータに含まれる、
     * 不要な改行やページ送り文字を除去して1行の綺麗なテキストにします。
     */
    private String cleanText(String text) {
        if (text == null) return "";
        return text.replace("\n", "") // 普通の改行を消す
                   .replace("\f", "") // ページ送り（文字化け・変な四角い記号の原因）を消す
                   .replace("\r", ""); // Windows系の改行を念のため消す
    }

    /**
     * JSONレスポンスの指定したキー（names や flavor_text_entries）から、
     * 日本語のテキストを探して返します。
     */
    private String getJapaneseName(Map<String, Object> res, String key) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) res.get(key);
        for (Map<String, Object> entry : entries) {
            Map<String, Object> lang = (Map<String, Object>) entry.get("language");
            // 日本語（漢字あり/なし）を見つけたら返す
            if ("ja-Hrkt".equals(lang.get("name")) || "ja".equals(lang.get("name"))) {
                // nameキーがあれば技名として返し、無ければflavor_textとして返す柔軟な作り
                return (String) (entry.containsKey("name") ? entry.get("name") : entry.get("flavor_text"));
            }
        }
        return "不明";
    }
}