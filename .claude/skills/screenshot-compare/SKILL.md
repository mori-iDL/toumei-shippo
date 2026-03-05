---
name: screenshot-compare
description: |
  パラメトリックパターンのスクリーンショット比較スキル。
  SSIM（構造類似性指数）による定量評価と、ピクセル差分画像の生成。
  Use when: パターンの視覚的差異測定、回帰テスト、チューニング効果の定量評価。
context: fork
agent: qa-tester
---

# スクリーンショット比較 — Screenshot Comparison

## 動的コンテキスト

### 描画の決定論性（src/toumei_shippo_designer.html）
- 全アルゴリズムは入力パラメータからシード値を決定論的に生成（`Math.random()`禁止）
- 同一入力 → 同一出力が保証されている（SSIM=1.00の根拠）
- Canvas: 350×350px（= 物理70mm、SCALE=5）

### 安全テスト基盤（L2826-2960）
- `measureDarkness(canvas)`: brightness < 100 のピクセル割合(%)を算出
- 暗度はSSIMの前提条件（暗度FAIL=画面真っ黒の状態ではSSIM比較が無意味）
- 144パターン安全テスト（`?debug=1`）が暗度を担保

### パラメータ正規化
- `normalizeWeight(w)`: 体重を -1〜+1 に正規化（中心: 3000g）
- `normalizeHeight(h)`: 身長を -1〜+1 に正規化（中心: 49cm）
- 体重→力強さ/繊細さ、身長→伸びやかさ/凝縮の質的変化

---

## Step 1: 比較目的の確認

| 目的 | 何を比較するか | 成功基準 |
|------|--------------|---------|
| **回帰テスト** | コード変更前 vs 後（同一入力） | SSIM > 0.95（意図しない破壊なし） |
| **差異測定** | 異なるパラメータ条件同士 | SSIM < 基準値（十分に異なる） |
| **チューニング評価** | アルゴリズム調整前 vs 後 | SSIM変化量が期待範囲内 |
| **決定論性証明** | 同一入力の2回実行 | SSIM = 1.00（完全一致） |

---

## Step 2: スクリーンショット取得

### 方法A: Claude Code preview環境（推奨）

```
1. preview_start でdev serverを起動
2. preview_eval で入力パラメータを設定:
   window.location.hash = '#name=はるか&season=spring&weight=3000&height=49'
   または UI操作: preview_fill / preview_click
3. 描画完了を待つ（50msデバウンス後）
4. preview_screenshot でキャプチャ
5. 画像を tmp/screenshots/{条件名}_{timestamp}.png に保存
```

### 方法B: ブラウザ手動キャプチャ

```
1. src/toumei_shippo_designer.html をブラウザで開く
2. パラメータを入力し描画を確認
3. Canvas要素を右クリック→「名前を付けて画像を保存」
4. または DevTools Console:
   document.querySelector('#laser-canvas').toDataURL('image/png')
```

### 方法C: 暗度計測の代用（SSIM未実装時）

144パターン安全テストの `measureDarkness()` を流用:
- 暗度の「差」で間接的に視覚的差異を推定
- 暗度差 > 10% → 構造的に異なる可能性が高い
- 暗度差 < 3% → ほぼ同一の可能性が高い
- 限界: 暗度が同じでもパターンが全く異なる場合がある（構造的差異は検出不可）

---

## Step 3: SSIM算出

### 3.1 SSIM（Structural Similarity Index）

| カテゴリ | SSIM基準 | 意味 |
|---------|---------|------|
| 同一入力再実行 | = 1.00 | 決定論的描画の証明 |
| コード変更前後（回帰） | > 0.95 | 意図しない視覚変化なし |
| 微調整後 | 0.80 - 0.95 | 変化はあるが破壊的でない |
| 異なるパラメータ | < 0.70 | 十分に異なる |
| 異なるモード | < 0.60 | モードの違いが明確 |

### 3.2 ピクセル差分

- 差分画像: 変化領域を赤色ハイライト
- 差分率 = 変化ピクセル数 / 全ピクセル数(350×350)
- 差分率 < 1% → 実質同一
- 差分率 > 30% → 大幅な構造変化

### 3.3 Node.jsスクリプト骨格

```javascript
// tmp/ssim-compare.mjs — SSIM計算スクリプト
import { readFileSync } from 'fs';
import { PNG } from 'pngjs';
// npm install pngjs pixelmatch

function loadPNG(path) {
  const data = readFileSync(path);
  return PNG.sync.read(data);
}

function calculateSSIM(img1, img2) {
  // ssim.js ライブラリを使用するか、
  // 簡易版: ピクセル単位の輝度比較で近似
  const { width, height } = img1;
  let sumSq = 0, count = 0;
  for (let i = 0; i < img1.data.length; i += 4) {
    const b1 = img1.data[i]*0.299 + img1.data[i+1]*0.587 + img1.data[i+2]*0.114;
    const b2 = img2.data[i]*0.299 + img2.data[i+1]*0.587 + img2.data[i+2]*0.114;
    sumSq += (b1 - b2) ** 2;
    count++;
  }
  const mse = sumSq / count;
  // 簡易SSIM近似（正式にはウィンドウベース計算が必要）
  return mse < 0.001 ? 1.0 : 1.0 - Math.min(mse / 16384, 1.0);
}

// 使用例:
// const img1 = loadPNG('tmp/screenshots/spring_haruka_1.png');
// const img2 = loadPNG('tmp/screenshots/spring_haruka_2.png');
// console.log('SSIM:', calculateSSIM(img1, img2));
```

**注意**: 上記は簡易近似。正式なSSIMは`ssim.js`ライブラリの使用を推奨。

---

## Step 4: テストケースペアと閾値判定

### 標準テストペア（9ペア）

| # | ペア | 条件A | 条件B | 期待SSIM | 測定対象 |
|---|------|-------|-------|----------|---------|
| 1 | 季節差 | 春・はるか | 冬・めい | < 0.50 | 主アルゴリズム差 |
| 2 | 名前差 | 春・はるか | 春・りく | < 0.70 | 副アルゴリズム差（母音ブレンド） |
| 3 | 時刻差 | 正午 | 真夜中 | < 0.80 | 主副ブレンド比差 |
| 4 | 体重差 | 2000g | 5000g（同条件） | < 0.75 | 力強さ/繊細さの質的差 |
| 5 | 身長差 | 40cm | 60cm（同条件） | < 0.75 | 凝縮/展開の質的差 |
| 6 | モード差 | レーザー | V溝NC | < 0.60 | 出力モードの視覚差 |
| 7 | 樹種差 | スギ | ケヤキ | < 0.85 | lineWeight/lineSpacing差 |
| 8 | 天気差 | 晴れ | 雨 | < 0.85 | 乱流度の差 |
| 9 | 同一再実行 | はるか(1) | はるか(2) | = 1.00 | 決定論的描画の証明 |

### 回帰テスト用ペア

| # | シナリオ | 比較対象 | 基準 |
|---|---------|---------|------|
| R1 | コード変更前後 | 同一入力・変更前screenshot | SSIM > 0.95 |
| R2 | リファクタリング後 | 同一入力・リファクタ前screenshot | SSIM = 1.00（出力不変のはず） |
| R3 | パラメータ微調整 | 調整前 vs 調整後 | 0.70 < SSIM < 0.95 |

### 境界値テスト

体重・身長の極端値で質的変化が十分に表れるか:

| テスト | 条件 | 比較対象 | 期待 |
|--------|------|---------|------|
| 最軽量 vs 中央 | 2000g×40cm vs 3000g×49cm | 同一条件 | SSIM < 0.75 |
| 中央 vs 最重量 | 3000g×49cm vs 5000g×60cm | 同一条件 | SSIM < 0.75 |
| 軽+長 vs 重+短 | 2000g×60cm vs 5000g×40cm | 同一条件 | SSIM < 0.70 |

---

## Step 5: レポート生成

### 結果テーブル形式

```
=== Screenshot Comparison Report ===
Date: YYYY-MM-DD
Mode: [回帰テスト / 差異測定 / チューニング]

| # | ペア       | SSIM  | 基準  | 判定 |
|---|-----------|-------|-------|------|
| 1 | 季節差     | 0.42  | <0.50 | ✅ PASS |
| 2 | 名前差     | 0.68  | <0.70 | ✅ PASS |
| 3 | 同一再実行  | 1.00  | =1.00 | ✅ PASS |

Overall: 3/3 PASS
```

### screenshotsディレクトリ構造

```
tmp/screenshots/
├── baseline/           # 基準スクリーンショット（回帰テスト用）
│   ├── spring_haruka_laser.png
│   ├── spring_haruka_vgroove.png
│   └── ...
├── current/            # 現在のスクリーンショット
│   ├── spring_haruka_laser.png
│   └── ...
├── diff/               # 差分画像
│   └── spring_haruka_diff.png
└── reports/            # テストレポート
    └── 2026-03-05_regression.md
```

---

## 実施フロー（Claude Code環境）

### 回帰テスト手順

1. **ベースライン取得**（コード変更前）
   - `preview_start` → パラメータ設定 → `preview_screenshot`
   - `tmp/screenshots/baseline/` に保存

2. **コード変更を実施**

3. **現在スクリーンショット取得**（コード変更後）
   - 同一パラメータ → `preview_screenshot`
   - `tmp/screenshots/current/` に保存

4. **比較**
   - Node.jsスクリプトでSSIM算出（または目視 + 暗度差で代用）
   - 差分画像を `tmp/screenshots/diff/` に保存

5. **判定**
   - SSIM > 0.95 → 回帰なし（意図的な変更以外は影響なし）
   - SSIM < 0.95 → 意図しない視覚変化あり → 調査

### 暫定評価（SSIM未実装時）

SSIMライブラリがインストールされていない環境での代替手順:

1. **目視比較**: 2枚のスクリーンショットを並べて構造的差異を確認
2. **暗度比較**: `measureDarkness()` で両者の暗度を取得、差分を算出
3. **定性評価**: visual-evalスキルの3軸（構造・テクスチャ・空間）で記述
4. **判定**: 「明らかに異なる / 微妙に異なる / 同一」の3段階

---

## 品質ゲート

| 軸 | ◎ 合格 | ○ 条件付き | △ 要改善 |
|----|--------|-----------|---------|
| 決定論性 | 同一入力 SSIM=1.00 | — | SSIM < 1.00（非決定的描画） |
| 差異充足 | 全標準ペアが基準クリア | 1-2ペアが基準±0.05 | 3ペア以上が基準未達 |
| 回帰防止 | 変更前後 SSIM > 0.95 | 0.90 < SSIM < 0.95 | SSIM < 0.90（意図しない破壊） |
| 暗度前提 | 144パターン安全テスト全OK | WARN数件(55-65%) | FAIL 1件以上(≥65%) |
| 体重身長 | 極端値ペアSSIM < 0.75 | 0.75 < SSIM < 0.80 | SSIM > 0.80（質的変化不足） |

## 関連スキル・エージェント
- `/visual-eval`: SSIMの基準値定義・テストケース設計の親スキル
- `/export-validate`: エクスポート前の品質基盤確認（暗度テスト含む）
- `design-tuner` agent: パラメータ調整の反復ループでSSIM評価を使用
- `qa-tester` agent: 回帰テスト時のビジュアルリグレッション検出
