---
name: export-validate
description: |
  SVG/PNG/DXFエクスポート結果の整合性検証スキル。
  出力ファイルのフォーマット妥当性、寸法精度、加工互換性をチェックする。
  Use when: エクスポート機能のテスト、出力ファイルの品質検証、加工前の最終確認。
context: fork
agent: qa-tester
---

# エクスポート検証 — Export Validation

## 動的コンテキスト

### 実装の基盤（src/toumei_shippo_designer.html）
- `DrawingRecorder` class (L866-975): Canvas APIプロキシ。描画コマンドを記録し、SVG/DXFに変換
- `exportSVG(mode)` (L2314): レーザー=色別3層、V溝=面幅別3レイヤー
- `exportPNG(mode)` (L2557): Canvas.toDataURL('image/png')
- `exportDXF()` (L2565): V溝専用。AC1015ヘッダー、4レイヤー、CAMガイド
- `mergeConnectedPaths()` (L2260): 端点距離≦toleranceのパスを連結
- `runSafetyTest()` (L2874): 144パターン暗度計測（`?debug=1`で起動）

### 物理仕様
- キャンバス: 350px = 物理70mm（SCALE=5, pxToMm=0.2）
- パターン領域: MARGIN_PX〜(MARGIN_PX+PATTERN_SIZE) = 15px〜335px = 3mm〜67mm（64mm角）
- 座標クリッピング: CADツール互換のため、SVG clip-pathに加えて座標自体をクランプ

---

## Step 1: エクスポート実行

対象モード × 出力形式の組み合わせ:

| 出力形式 | レーザーモード | V溝NCモード |
|---------|------------|-----------|
| SVG | `exportSVG('laser')` | `exportSVG('vgroove')` |
| PNG | `exportPNG('laser')` | `exportPNG('vgroove')` |
| DXF | — （V溝専用） | `exportDXF()` |

エクスポート前の確認:
- パラメータが有効な範囲にあること（名前が空でない、誕生日が設定済み）
- `lastRecordedPaths[mode]`に描画パスが存在すること
- `render()`が正常完了していること（エラーなし）

---

## Step 2: フォーマット検証

### SVG検証チェックリスト

| # | チェック項目 | 基準 | 確認方法 |
|---|------------|------|---------|
| S1 | XML妥当性 | パーサーエラーなし | `new DOMParser().parseFromString()` でエラー検出 |
| S2 | viewBox | `0 0 70 70`（mm単位） | SVGルート要素のviewBox属性 |
| S3 | 名前空間 | レーザー: inkscape名前空間あり / V溝: なし | xmlns:inkscape属性の有無 |
| S4 | width/height | レーザー: `70mm` / V溝: `70`（単位なし=mm前提） | SVGルート要素のwidth/height |
| S5 | クリップパス | `<clipPath id="pattern-clip">` + 3mm-67mm矩形 | defs内の定義 |
| S6 | タイトル要素 | `<title>とうめいしっぽ パラメトリックパネル — {mode}</title>` | title要素の存在 |
| S7 | 描画データ | 1つ以上の`<path>`または`<line>`要素 | ENTITIES内の要素数 > 0 |

### レーザーSVG固有

| # | チェック項目 | 基準 |
|---|------------|------|
| L1 | 3層レイヤー構成 | accent / pattern / background（`<g id="...">`） |
| L2 | 色マッピング | accent=#000000, pattern=#FF0000, background=#0000FF |
| L3 | レイヤーラベル | `inkscape:label`属性にパス数情報 |
| L4 | 最小stroke-width | `LASER_MIN_STROKE_PX`=0.5px → 0.1mm。未満はクランプ済み |
| L5 | opacity抑制 | レーザーモードではopacity属性を出力しない |

### V溝NC SVG固有

| # | チェック項目 | 基準 |
|---|------------|------|
| V1 | 面幅別レイヤー | CHAMFER_BOLD / CHAMFER_MEDIUM / CHAMFER_FINE |
| V2 | 色マッピング | bold=#FF0000, medium=#00FF00, fine=#0000FF |
| V3 | desc要素 | 60°ビット情報 + 面幅構成（Single/Dual/Triple） |
| V4 | 最小stroke-width | 0.3mm（pxToMm換算で1.5px）未満を除外 |
| V5 | opacity除外 | NC加工にopacity概念なし→属性出力しない |

### PNG検証チェックリスト

| # | チェック項目 | 基準 |
|---|------------|------|
| P1 | 解像度 | 350×350px（Canvas.width × Canvas.height） |
| P2 | base64デコード | `canvas.toDataURL('image/png')`が有効なdata URI |
| P3 | 背景色 | レーザー: #f5ede0 / V溝: #e8dcc8 |
| P4 | 非ブランク | 完全な背景色のみ（描画なし）ではないこと |

### DXF検証チェックリスト

| # | チェック項目 | 基準 | 確認方法 |
|---|------------|------|---------|
| D1 | ヘッダーセクション | `0\nSECTION\n2\nHEADER` で開始 | 文字列検索 |
| D2 | 単位設定 | `$INSUNITS` = 4（mm） | ヘッダー内の値 |
| D3 | CAMガイド | `999\n--- toumei-shippo CAM Guide ---` | 999コメント行 |
| D4 | 樹種情報 | `999\n樹種:` + 硬度ラベル（高/中/低） | CAMガイド内 |
| D5 | ビット情報 | `999\nビット: 60deg V-groove` | CAMガイド内 |
| D6 | LTYPEテーブル | CONTINUOUS線種の定義 | TABLESセクション |
| D7 | レイヤー定義 | 4レイヤー: BORDER(白7) / CHAMFER_BOLD(赤1) / CHAMFER_MEDIUM(緑3) / CHAMFER_FINE(青5) | LAYERテーブル |
| D8 | 外枠 | 70mm角の閉ポリライン（BORDERレイヤー） | ENTITIESセクション |
| D9 | 有効エリア枠 | 3mm〜67mm（64mm角）の閉ポリライン | ENTITIESセクション |
| D10 | 座標範囲 | 全座標が0〜70mmの範囲内 | 全エンティティの座標値 |
| D11 | エンティティ数 | ポリライン + 円 > 0（描画データあり） | ENTITIESセクション |
| D12 | ENDSEC/EOF | 正常終端 | ファイル末尾 |

---

## Step 3: 加工互換性検証

### パス品質

| チェック | 基準 | 根拠 |
|---------|------|------|
| パス連結性 | `mergeConnectedPaths`後の結合率 > 50% | 細切れパスはNC加工時のリフト回数増加 |
| 座標クリッピング | パターン領域(3-67mm)内に収まること | 領域外の線はパネル端面を傷つける |
| fillRect→DXF変換 | 0.3mm未満のfillRectは除外済み | 微小矩形はNC加工不可 |
| closePath対応 | DrawingRecorderが記録→SVG 'Z' / DXF閉ポリライン | 波動関数（母音「お」）で使用 |

### ツール互換性

| ツール | 確認事項 |
|--------|---------|
| Fusion 360 | SVG: viewBox=`0 0 70 70`（単位なし）で1:1インポート。clip-path非対応→座標クランプで代替 |
| Rhinoceros | DXF: AC1015以上、CONTINUOUS線種必須、レイヤー色番号でフィルタ |
| xTool P2S | SVG: inkscape名前空間 + 色別レイヤー。パス数/速度/回数を色で制御 |
| Inkscape | SVG: `inkscape:label` + `inkscape:groupmode="layer"`でレイヤーパネルに表示 |

---

## Step 4: 既存安全テストとの関係

`?debug=1`の144パターン安全テスト（`runSafetyTest()` L2874）は、エクスポート検証の**前提条件**:

| テスト | 目的 | 閾値 |
|--------|------|------|
| V溝暗度（108パターン） | 4季節×9樹種×3モード。画面が真っ黒にならないこと | WARN 55% / FAIL 65% |
| レーザー暗度（36パターン） | 4季節×9樹種。描画が過密にならないこと | WARN 55% / FAIL 65% |
| レーザー細線（36パターン） | `LASER_MIN_STROKE_PX`未満の線がないこと | exportSVGでクランプ適用 |
| レーザー△樹種ヒント | ナラ・ケヤキの注意事項表示 | console.info出力 |

**安全テストOK → エクスポート検証に進む。** 安全テストFAILの状態でエクスポートしても品質は保証されない。

---

## 品質ゲート

| 軸 | ◎ 合格 | ○ 条件付き合格 | △ 要改善 |
|----|--------|---------------|---------|
| フォーマット | 全チェック項目PASS | 軽微な警告あり（descなし等） | パーサーエラーまたは構造不備 |
| 寸法精度 | 全座標が0-70mm範囲内 | 1-2点が境界外だがクランプで対処可 | 座標系がpx単位のまま |
| 加工互換性 | Fusion360/xToolで読込確認済み | ツール側で軽微な修正要 | レイヤー構成が認識されない |
| 安全テスト | 144パターン全OK | WARN数件あり（55%超） | FAIL 1件以上（65%超） |

## 関連スキル・エージェント
- `/nc-machining`: DXFのV溝加工パス検証に使用
- `/laser-processing`: SVGのレーザーレイヤー検証に使用
- `qa-tester` agent: テストマトリクスの一部として使用
- `code-builder` agent: エクスポート機能の実装時に参照
