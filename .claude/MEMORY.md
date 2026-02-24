# Toumei-Shippo — Project Memory

## 次のセッションへ（最優先で読むこと）
- Handoff: `docs/HANDOFF_2026-02-25_hook-architecture-session.md`
- 中断地点: Hook強制機構の実装完了 + ~/.claude/ Git管理化完了。全タスク完了
- 次のアクション: とうめいしっぽ本体の開発タスクに戻る（タスクDB松森ビュー参照）

## プロジェクト状態
- メインソース: `src/toumei_shippo_designer.html` — パラメトリックパネルデザイナー
- P0〜P2は解決済み。P3（DXF最適化）、P4（手動オーバーライドUI）が次の候補
- Notion MCP連携: CLAUDE.mdに全DB IDとview://URLを整備済み

## 直近の重要変更（2026-02-24〜25）
- CLAUDE.md: Notion MCP連携セクションをEnhanced MCP対応に全面更新
- ~/.claude/: hooks/rules/agents/skills がGit管理下に（別リポジトリ）
- Mission/Vision/Values文書: `~/.claude/rules/mission.md` として全セッション自動読込
- 4エージェント強制注入: UserPromptSubmitフックが毎ターン[4agents][mission]を注入
- Notion自動同期: stop-notion-sync.sh がセッション終了時にClaude作業メモへ自動書込
