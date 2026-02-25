# エクスポート検証レポート — 2026-02-25

## 概要

V溝NC＋レーザー3層への再設計（commits `d830e6b`, `3cc6f5d`）後のSVG/DXFエクスポートを、
4季節 × 8モード = 32パターンで網羅的に検証した。

**結論**: レーザーSVGは全パターン正常。V溝SVG/DXFに**夏（ボロノイ）と秋（反応拡散）でプライマリレイヤーが空になる重大な問題**を発見。

---

## テスト環境

- ブラウザ: Chromium（Claude Preview内蔵）
- テスト方法: JavaScriptインジェクションによる自動パラメータ設定 → SVG生成 → 構造解析
- テストケース: 32パターン（4季節 × [レーザー + V溝Single×3面幅 + V溝Dual×3コンボ + V溝Triple]）

---

## 結果サマリ

### レーザーSVG（4テスト）

| 季節 | Valid XML | viewBox | レイヤー数 | accent | pattern | background | 判定 |
|------|-----------|---------|-----------|--------|---------|------------|------|
| 春（Fibonacci） | OK | 0 0 70 70 | 3 | 154 | 164 | 82 | **PASS** |
| 夏（Voronoi） | OK | 0 0 70 70 | 3 | 835 | 1840 | 82 | **PASS** |
| 秋（RxnDiff） | OK | 0 0 70 70 | 3 | 11 | 4032 | 913 | **PASS** |
| 冬（Fractal） | OK | 0 0 70 70 | 3 | 4 | 55 | 410 | **PASS** |

**全パターン正常。** 3色レイヤー（青/赤/緑）が正しく分離され、xTool P2Sの色別パワー設定に対応可能。

### V溝SVG — Single モード（12テスト）

| 季節 | 面幅 | レイヤー | 要素数 | 判定 | 備考 |
|------|------|---------|--------|------|------|
| 春 | fine | fine | 400 | **PASS** | |
| 春 | medium | medium | 400 | **PASS** | |
| 春 | bold | bold | 400 | **PASS** | |
| 夏 | fine | fine | 42 | **WARN** | 主アルゴリズム要素なし（副のみ） |
| 夏 | medium | medium | 42 | **WARN** | 同上 |
| 夏 | bold | bold | 42 | **WARN** | 同上 |
| 秋 | fine | fine | 42 | **WARN** | 主アルゴリズム要素なし（副のみ） |
| 秋 | medium | medium | 42 | **WARN** | 同上 |
| 秋 | bold | bold | 42 | **WARN** | 同上 |
| 冬 | fine | fine | 469 | **PASS** | |
| 冬 | medium | medium | 469 | **PASS** | |
| 冬 | bold | bold | 469 | **PASS** | |

**夏・秋のSingle**: SVGは出力されるが、内容は**副アルゴリズムのパスのみ**（42要素=副パターン39+その他3）。
主アルゴリズム（Voronoi/RxnDiff）の描画要素がすべてフィルタアウトされている。
Singleモードではsub:パスがprimaryレイヤーに統合されるため、見かけ上は内容があるように見える。

### V溝SVG — Dual モード（12テスト）

| 季節 | コンボ | primaryレイヤー | secondaryレイヤー | 判定 |
|------|--------|----------------|-------------------|------|
| 春 | bold+fine | bold: 164 | fine: 236 | **PASS** |
| 春 | bold+medium | bold: 164 | medium: 236 | **PASS** |
| 春 | medium+fine | medium: 164 | fine: 236 | **PASS** |
| **夏** | bold+fine | **bold: 0** | fine: 153 | **FAIL** |
| **夏** | bold+medium | **bold: 0** | medium: 153 | **FAIL** |
| **夏** | medium+fine | **medium: 0** | fine: 153 | **FAIL** |
| **秋** | bold+fine | **bold: 0** | fine: 153 | **FAIL** |
| **秋** | bold+medium | **bold: 0** | medium: 153 | **FAIL** |
| **秋** | medium+fine | **medium: 0** | fine: 153 | **FAIL** |
| 冬 | bold+fine | bold: 56 | fine: 413 | **PASS** |
| 冬 | bold+medium | bold: 56 | medium: 413 | **PASS** |
| 冬 | medium+fine | medium: 56 | fine: 413 | **PASS** |

**夏・秋のDual: プライマリレイヤーが完全に空。** 加工データとして不成立。

### V溝SVG — Triple モード（4テスト）

| 季節 | bold | medium | fine | 判定 |
|------|------|--------|------|------|
| 春 | 87 | 75 | 238 | **PASS** |
| **夏** | **0** | **0** | 153 | **FAIL** |
| **秋** | **0** | **0** | 153 | **FAIL** |
| 冬 | 56 | 59 | 354 | **PASS** |

**夏・秋のTriple: bold/mediumレイヤーが空。** fineのみ=副アルゴリズム由来。

### DXF

SVGと同一のフィルタリングロジック（MIN_STROKE_WIDTH=0.3mm）を使用。
**夏・秋のV溝で同一の問題が発生する。**

---

## 根本原因の分析

### 問題のメカニズム

V溝SVG/DXFフィルタリング（line 2158-2164, 2399-2407）:

```javascript
const strokeWidthMm = (p.lineWidth || 1) * pxToMm;  // pxToMm = 0.2
if (strokeWidthMm < MIN_STROKE_WIDTH_MM) continue;   // MIN = 0.3mm
```

| アルゴリズム | 描画タイプ | lineWidth | 計算結果 | 閾値 | 結果 |
|-------------|-----------|-----------|---------|------|------|
| Fibonacci | stroke (lineTo) | 1.0〜6.0 | 0.2〜1.2mm | 0.3mm | **通過** |
| Voronoi | **fillRect** | **0.0** | (0\|\|1)×0.2 = **0.2mm** | 0.3mm | **除外** |
| RxnDiff | **fillRect** | **0.0** | (0\|\|1)×0.2 = **0.2mm** | 0.3mm | **除外** |
| Fractal | stroke (lineTo) | 0.5〜3.0 | 0.1〜0.6mm | 0.3mm | **大部分通過** |

### なぜ夏と秋だけ問題になるか

- **Voronoi**: 小さなfillRect（セル塗り潰し）で模様を構成。1609個のfillRect × lineWidth=0.0
- **RxnDiff（反応拡散）**: 同上。5253個のfillRect × lineWidth=0.0
- **Fibonacci**: strokeベースの線描画。lineWidth > 0 → フィルタ通過
- **Fractal**: strokeベースの分岐線。lineWidth > 0 → フィルタ通過

### 設計的な本質

これは単純なフィルタ閾値の問題ではなく、**描画方式とNC加工方式の根本的な不一致**。

- V溝NCは「線に沿って切る」加工 → **stroke（線）パスが必要**
- Voronoi/RxnDiffは「面を塗る」描画 → **fill（塗り潰し）で模様を表現**
- 塗り潰し面積をそのまま「彫る」ことはV溝ビットではできない

---

## 修正提案

### 案A: fillRectをエッジストロークに変換（推奨）

Voronoi/RxnDiffのV溝モード描画を「塗り潰し」から「輪郭線」に変換する。

- **Voronoi**: セルの塗り潰し → セルの**境界線（エッジ）**をstrokeで描画
- **RxnDiff**: ピクセル塗り潰し → **等高線（contour）**をstrokeで描画

これにより:
- レーザーモードは従来通りfillRect（面彫刻で問題なし）
- V溝モードはstrokeベースの線描画（NCビットで加工可能）
- 同じアルゴリズムが加工方式に応じた出力を生成

実装規模: 中〜大（各アルゴリズムにV溝専用描画分岐を追加）

### 案B: フィルタ条件の分岐

fillRect要素にはstrokeWidth閾値を適用しない（type === 'fillRect' なら通過させる）。
DXFのfillRect→ポリライン変換コード（既存）がそのまま使える。

- **利点**: 即座に修正可能。既存コードの変更最小
- **リスク**: 0.2mm以下の微小fillRectがNC加工に適さない可能性（加工テスト要）
  - 特にRxnDiffは1ピクセル≒0.2mm角のfillRectが多数 → 加工精度限界に近い

### 案C: V溝Canvas描画時にfillRectを使わない

render()関数内で、V溝キャンバスへの描画時にVoronoi/RxnDiffの描画関数を
fillRect→strokeRect（or lineTo）に切り替える。

- **利点**: Canvas表示とエクスポートが自然に一致
- **課題**: Canvas表示の見た目が変わる（面塗り→輪郭のみ）

---

## 全体評価

### 加工データとしての実用性

| フォーマット | 春 | 夏 | 秋 | 冬 | 総合 |
|------------|-----|-----|-----|-----|------|
| レーザーSVG | ◎ 加工可 | ◎ 加工可 | ◎ 加工可 | ◎ 加工可 | **◎ 全季節加工可** |
| V溝SVG (Single) | ◎ | △ 副パターンのみ | △ 副パターンのみ | ◎ | **△ 2季節で主パターン欠落** |
| V溝SVG (Dual/Triple) | ◎ | ✕ 主レイヤー空 | ✕ 主レイヤー空 | ◎ | **✕ 2季節で加工不可** |
| DXF | ◎ | ✕ 同上 | ✕ 同上 | ◎ | **✕ 同上** |

### 品質面（問題なし項目）

- XML整合性: 全パターンvalid
- viewBox: 全パターン正常（70×70）
- NaN/Infinity: 検出なし
- 座標範囲: パターン領域内（3.0〜67.0mm）にクランプ済み
- レイヤー構造: 正しいID・色・inkscape属性
- パス連結: mergeConnectedPathsが正常動作
- 単位系: レーザー=mm付き、V溝=CAD用unitless

---

## 次のアクション

1. **Zineと方針確認**: 案A/B/Cのいずれで進めるか
2. 方針決定後に実装 → 再検証
3. 実機テスト（xTool P2Sでレーザー出力、Fusion360でDXFインポート）で加工適性を最終確認

---

*検証実施: Claude Code | テストケース: 32パターン | 自動SVG解析（JavaScript injection）*
