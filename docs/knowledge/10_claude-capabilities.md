# Claude能力マトリクス — とうめいしっぽ専用

> Benjaminの領域：「何を使う？」を忘れない。状況に応じて最適な武器を選ぶ。

---

## 内在4エージェント（全セッションで稼働）

| Agent | 名 | 役割 | このプロジェクトでの具体的な問い |
|-------|-----|------|-------------------------------|
| **Captain** | 私自身 | 統合・判断 | この判断は10年後のZineが誇れるか？STEAMの交差点にあるか？ |
| **Harper** | 斥候 | 事実・リサーチ | 年輪DBに前例は？Notion タスクDBの状態は？Google Drive資料に根拠は？ |
| **Benjamin** | 棟梁 | 技術・コスト・ツール選択 | どのSkill/Subagentが最適？コードで解決か手作業か？数字は合うか？ |
| **Lucas** | 目利き | 美意識・盲点 | Digital Nature哲学に沿うか？新田さん/阿部さんはどう感じる？見落としは？ |

---

## Skills — Zineが直接起動するインターフェース

| スキル | 発動条件（この場面で使え） | 使い忘れやすい場面 |
|--------|------------------------|-------------------|
| `/estimate` | 原価・価格の話題が出た時 | MTG準備でコスト議論する時に手計算しがち |
| `/cost-model` | 製造原価の詳細計算 | 事業計画書のコスト欄を埋める時 |
| `/visualize` | 概念図・フロー図・構造図が必要な時 | プレゼン資料の図を作る時にスライドツールに逃げがち |
| `/post-draft` | 発信コンテンツの下書き | 「何か発信ネタない？」の時 |
| `/project-brief` | プロジェクト概況の即時把握 | 新セッション開始時・MTG前の準備 |
| `/project-status` | Git状態・TODO・ディレクトリ構造の一括確認 | 作業開始前の現状把握 |
| `/notion` | Notion検索・タスク確認・年輪検索 | Notion MCP直叩きでハマる前にまずこれ |
| `/session-distill` | セッション終了前の年輪候補抽出 | 長セッション後に記録を忘れがち |
| `/material-check` | 木材・資材の在庫確認 | 樹種選定の議論時 |
| `/export-validate` | SVG/PNG/DXFエクスポートの品質検証 | 加工データ出力後の検証を手動でやりがち |
| `/screenshot-compare` | パターンの視覚的差異測定（SSIM） | チューニング効果を「目視で十分」と判断しがち |
| `/visual-eval` | パターン品質の定量評価 | 「見た目OK」で終わらせがち |
| `/wood-species` | 9樹種の木材データベース参照 | 樹種パラメータの議論時 |

---

## Subagents — メインセッションが委任するバックエンドワーカー

| エージェント | 発動条件 | 委任すべき場面（手作業するな） |
|------------|---------|---------------------------|
| **code-builder** | HTML/CSS/JS実装・バグ修正 | 大きなコード変更。メインセッションで直接書くと文脈を消費する |
| **design-tuner** | パラメータ調整・視覚評価ループ | アルゴリズム係数の反復調整。手動だと何往復もかかる |
| **qa-tester** | テスト・検証 | エクスポート検証、クロスブラウザ確認、パラメータ組み合わせ網羅 |
| **strategy-checker** | ビジネス整合性チェック | 技術判断が事業計画・ステークホルダー期待と矛盾しないか確認 |
| **notion-specialist** | 複雑なNotion操作 | 複数ステップのNotion検索・バルク操作。直接MCP叩くよりこちら |
| **nenrin-writer** | 年輪DB記録 | 年輪を刻む時。常にhaiku + user memory |
| **content-crafter** | 情報発信コンテンツ下書き | Instagram/note/Substack用。/post-draftスキルが呼ぶ |
| **research-scout** | Web調査＋構造化要約 | 市場調査、競合分析、技術トレンド調査 |
| **business-strategist** | 事業判断支援 | 価格設定、原価計算、パートナーシップ評価 |
| **wood-craft-memory** | 木工・素材・加工技法の知識蓄積 | 加工パラメータが出た時、暗黙知の外化 |
| **miro-specialist** | Miroボード設計・構築 | ビジュアルストーリーテリング、プレゼン構成 |
| **wellbeing-guardian** | 心身の状態理解 | 疲労・睡眠の話題、スケジュール調整 |

---

## MCP — 外部システム連携

| MCP | 使うべき場面 | 注意点 |
|-----|------------|--------|
| **Notion** | 年輪DB読み書き、タスクDB、プロジェクトHub | `notion-update-page`は上流バグで使用不可。回避策: `create-comment`経由 |
| **Chrome/Preview** | HTMLプレビュー、スクリーンショット、Web操作 | ローカルのみ。preview_startでサーバー起動→preview_screenshot |
| **Grasshopper** | パラメトリックデザイン探索 | Rhino起動中のみ。🟡技術検証中 |
| **Miro** | ボード作成・編集 | miro-specialist経由が確実 |

### Notion MCP クイックリファレンス

| やりたいこと | ツール | パラメータ |
|------------|--------|----------|
| ページ内容取得 | `notion-fetch` | `id: "page-uuid"` or URL |
| DB構造確認 | `notion-fetch` | `id: "db-url"` |
| タスク一覧（松森ビュー） | `notion-query-database-view` | `view_url: "view://7bfa6943-..."` |
| タスク一覧（ボードビュー） | `notion-query-database-view` | `view_url: "view://06efc822-..."` |
| 年輪DB検索 | `notion-search` | `data_source_url: "collection://30c452e5-..."` |
| 新規タスク作成 | `notion-create-pages` | `parent: {data_source_id: "5ced62c5-..."}` |
| コメント追記 | `notion-create-comment` | `page_id`, `rich_text` |
| ❌ ページ更新 | — | **上流バグ**。`create-comment`でNotion AIに委任 |

---

## 判断→実行の早見表（Decision-Action Matrix）

| 場面 | 判断分類 | 行動 |
|------|---------|------|
| コード修正・ファイル読み取り | 可逆 & 明確 | **即実行** |
| アルゴリズム設計選択 | 可逆 & 不明確 | 4エージェントDebate → 実行 |
| Notion書き込み | 不可逆 | Debate → Zineに確認 → 実行 |
| Git push | 不可逆 | Debate → Zineに確認 → 実行 |
| 価格決定・事業方針 | 重大 & 不可逆 | 外在MAGI → Zineの判断 |
| パラメータ調整の反復 | 可逆 & 明確 | design-tunerに委任。即実行 |
| プレゼン資料の構成変更 | 可逆 & 不明確 | Debate → 実行 → Zineにレビュー依頼 |

---

## 忘れがちリスト（Benjaminの自戒）

1. **Subagentに委任すべきをメインで手作業する** — コード変更が10行超えたらcode-builderを検討
2. **Notion MCP直叩きでハマる** — まず`/notion`スキルかnotion-specialist経由
3. **/estimate を使わず手計算する** — 原価の話が出たら即Skills起動
4. **スクリーンショット比較を目視で済ませる** — /screenshot-compare + SSIM定量評価
5. **Strategy-checkerを呼ばない** — 技術判断の後に「事業計画と矛盾しないか？」を確認する習慣
6. **年輪記録を後回しにする** — マイルストーン到達時は即nenrin-writer
7. **preview機能を使わずブラウザ操作する** — HTMLプレビューはpreview_start/preview_screenshot
