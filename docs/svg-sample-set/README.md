# SVGサンプルセット — 原価実測用

生成日: 2026-02-20
用途: 工房でのレーザー/NC加工時間の実測 → 原価精緻化

## パターン一覧（12パターン × 2モード = 24ファイル）

| # | ファイル名 | 季節 | 体格 | 名前 | 誕生日 | 体重 | 身長 | 天気 | アルゴリズム |
|---|-----------|------|------|------|--------|------|------|------|------------|
| 1 | spring_small | 春 | 小 | はるか | 2025/04/10 | 2500g | 46cm | 晴 | Fibonacci Spiral |
| 2 | spring_medium | 春 | 中 | はると | 2025/04/15 | 3000g | 49cm | 晴 | Fibonacci Spiral |
| 3 | spring_large | 春 | 大 | さくら | 2025/04/20 | 3800g | 52cm | 曇 | Fibonacci Spiral |
| 4 | summer_small | 夏 | 小 | なつみ | 2025/07/05 | 2500g | 46cm | 晴 | Voronoi |
| 5 | summer_medium | 夏 | 中 | りく | 2025/07/15 | 3000g | 49cm | 晴 | Voronoi |
| 6 | summer_large | 夏 | 大 | そうた | 2025/07/25 | 3800g | 52cm | 雨 | Voronoi |
| 7 | autumn_small | 秋 | 小 | あかり | 2025/10/03 | 2500g | 46cm | 曇 | Reaction-Diffusion |
| 8 | autumn_medium | 秋 | 中 | ゆうと | 2025/10/12 | 3000g | 49cm | 晴 | Reaction-Diffusion |
| 9 | autumn_large | 秋 | 大 | みのり | 2025/10/22 | 3800g | 52cm | 晴 | Reaction-Diffusion |
| 10 | winter_small | 冬 | 小 | ふゆき | 2025/01/08 | 2500g | 46cm | 雪 | Fractal |
| 11 | winter_medium | 冬 | 中 | れん | 2025/01/15 | 3000g | 49cm | 雪 | Fractal |
| 12 | winter_large | 冬 | 大 | こはる | 2025/01/28 | 3800g | 52cm | 曇 | Fractal |

## ファイル命名規則

`{季節}_{体格}_{モード}.svg`

- 季節: spring / summer / autumn / winter
- 体格: small(2500g/46cm) / medium(3000g/49cm) / large(3800g/52cm)
- モード: laser（レーザー彫刻用） / vgroove（V溝NC加工用）

## 共通パラメータ

- 樹種: スギ（岩手県産）
- 木目角度: 5°
- パネルサイズ: 70mm × 70mm（有効描画: 64mm × 64mm）
- アルゴリズム: 季節による自動選択（プライマリ）+ 名前の母音による自動選択（セカンダリ）

## 加工時間実測の記録方法

各SVGファイルについて、以下を記録してください：

| ファイル | レーザー加工時間 | NC加工時間 | 備考 |
|---------|---------------|-----------|------|
| spring_small_laser.svg | _分_秒 | — | |
| spring_small_vgroove.svg | — | _分_秒 | |
| ... | | | |

実測結果 → `docs/business-hypothesis-v1.md` の原価モデルに反映
