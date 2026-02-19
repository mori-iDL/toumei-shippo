# とうめいしっぽ — Claude Code 開発環境

## クイックスタート

### 1. このフォルダをローカルにコピー

```bash
# プロジェクトフォルダとして配置
# 例: ~/Projects/toumei-shippo/
```

### 2. Claude Codeで開く

```bash
cd ~/Projects/toumei-shippo
claude
```

Claude Codeが起動すると、**CLAUDE.md**が自動的に読み込まれ、
3チャット分の文脈（設計哲学・三層アーキテクチャ・コスト・課題）を
すべて把握した状態で作業を開始できる。

### 3. 使い方の例

```
# P0課題に取り組む（パラメータの視覚的差異改善）
「design-tunerを使って、4つのテストケースでパターンの差異を評価して」

# コードの修正
「code-builderで、フィボナッチ螺旋の係数範囲を1.0〜3.0に拡張して」

# 事業整合性チェック
「strategy-checkerで、加工時間が6分に増えた場合のコスト影響を確認して」

# テスト実行
「qa-testerで、全季節×全母音の組み合わせをテストして」
```

## プロジェクト構造

```
toumei-shippo/
├── CLAUDE.md                          ← 🌳 プロジェクト憲法（全エージェントが読む）
├── README.md                          ← このファイル
├── .claude/
│   ├── agents/                        ← 🤖 4つの専門エージェント
│   │   ├── design-tuner.md            ←   美的チューニング担当
│   │   ├── code-builder.md            ←   コード実装担当
│   │   ├── strategy-checker.md        ←   事業整合性チェック担当
│   │   └── qa-tester.md               ←   テスト・検証担当
│   └── skills/                        ← 📚 再利用可能な知識モジュール
│       ├── wood-species/SKILL.md      ←   岩手9樹種データベース
│       ├── cost-model/SKILL.md        ←   製造原価計算ロジック
│       └── visual-eval/SKILL.md       ←   視覚的差異評価基準
├── src/
│   └── toumei_shippo_designer.html    ← 💻 メインアプリケーション（v1.0）
└── docs/                              ← 📄 ドキュメント置き場
```

## エージェントの役割分担

| エージェント | モデル | 役割 | いつ使う |
|------------|--------|------|---------|
| **design-tuner** | Sonnet | パラメータ空間探索・視覚評価 | P0課題の解決、アルゴリズム調整 |
| **code-builder** | Sonnet | HTML/JS実装・バグ修正 | 機能追加、バグ修正、最適化 |
| **strategy-checker** | Sonnet | ビジネス整合性検証 | コスト影響、MTG資料作成 |
| **qa-tester** | Haiku | テスト・検証（高速） | 変更後の回帰テスト、エクスポート確認 |

## 最優先課題: P0

**パラメータ変化の視覚的差異が不十分**

異なる赤ちゃんのデータを入力しても、出力パターンの違いが小さすぎる。
design-tunerエージェントによる自動チューニングループで解決を目指す。

## 注意事項

- `src/toumei_shippo_designer.html` はシングルファイル構成を維持すること
- `Math.random()` 禁止（決定論的なシード生成のみ使用）
- コスト ¥820-887/枚 の範囲を意識すること
