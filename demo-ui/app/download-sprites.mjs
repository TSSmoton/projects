import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

// ESMで __dirname を再現する設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // 保存先フォルダの作成（プロジェクトルートの public/pokemon）
// const dir = path.join(__dirname, "public", "pokemon");
// 修正後：実行ディレクトリ（demo-ui）の直下にある public/pokemon を指す
const dir = path.join(process.cwd(), "public", "pokemon");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const download = (id) => {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  const filePath = path.join(dir, `${id}.png`);

  https
    .get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${id}.png`);
        });
      } else {
        console.error(`❌ Failed: ${id}.png (Status: ${res.statusCode})`);
      }
    })
    .on("error", (err) => {
      console.error(`⚠️ Error downloading ${id}: ${err.message}`);
    });
};

console.log("🚀 ポケモン画像のダウンロードを開始します...");

// // 1番から1025番まで。サーバーに負荷をかけないよう0.1秒ずつずらして実行
// for (let i = 1; i <= 1025; i++) {
//   setTimeout(() => download(i), i * 100);
// }
// download-sprites.mjs のループ部分を書き換え
for (let i = 10275; i <= 10325; i++) {
  setTimeout(() => download(i), (i - 10275) * 100);
}
