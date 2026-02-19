#!/bin/bash
# validate-html.sh
# PostToolUse フック: Edit/Write 後にHTMLの基本検証を実行
# - Math.random() の使用を禁止（シード値ベースの乱数のみ許可）
# - DOCTYPE宣言の存在を確認

# nodeのパスを解決
NODE=$(command -v node 2>/dev/null || echo "/usr/local/bin/node")
if [ ! -x "$NODE" ]; then
  NODE="$HOME/.nvm/versions/node/v24.7.0/bin/node"
fi

if [ ! -x "$NODE" ]; then
  echo "⚠️ node not found, skipping validation"
  exit 0
fi

# プロジェクトルートを特定
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
HTML_FILE="$PROJECT_DIR/src/toumei_shippo_designer.html"

if [ ! -f "$HTML_FILE" ]; then
  echo "⚠️ HTML file not found: $HTML_FILE"
  exit 0
fi

$NODE -e "
const fs = require('fs');
const h = fs.readFileSync('$HTML_FILE', 'utf8');

let errors = [];

if (h.includes('Math.random()')) {
  errors.push('Math.random() detected! Use seeded random only.');
}

if (!h.includes('<!DOCTYPE html>')) {
  errors.push('Invalid HTML: missing DOCTYPE');
}

if (errors.length > 0) {
  errors.forEach(e => console.error('❌ ' + e));
  process.exit(2);
} else {
  console.log('✅ HTML validation passed');
}
"
