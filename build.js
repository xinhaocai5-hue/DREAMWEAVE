/**
 * 织梦纺 构建脚本
 * 1. 将 src/app.jsx 预编译为 app.js（消除浏览器内 Babel 实时编译）
 * 2. 用 Tailwind CLI 预构建 styles.css（消除 Tailwind CDN 运行时）
 *
 * 用法：npm run build
 * 修改代码后只需编辑 src/app.jsx，然后运行 npm run build
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const babel = require('@babel/core');
const { minify } = require('terser');

const PROJECT_DIR = __dirname;

async function main() {
  console.log('=== 织梦纺 构建开始 ===\n');

  // ── 1. 编译 JSX ──
  const jsxPath = path.join(PROJECT_DIR, 'src', 'app.jsx');
  if (!fs.existsSync(jsxPath)) {
    console.error('[ERROR] 未找到 src/app.jsx，请确保源文件存在');
    process.exit(1);
  }
  const jsxCode = fs.readFileSync(jsxPath, 'utf-8').trim();
  console.log(`[1/4] 读取 src/app.jsx: ${(jsxCode.length / 1024).toFixed(1)} KB`);

  // 2. 用 Babel 编译 JSX -> 普通 JS
  const result = babel.transformSync(jsxCode, {
    presets: [
      ['@babel/preset-env', {
        targets: '> 0.5%, last 2 versions, not dead',
        modules: false,
      }],
      ['@babel/preset-react'],
    ],
  });
  console.log(`[2/4] Babel 编译完成: ${(result.code.length / 1024).toFixed(1)} KB`);

  // 3. 用 terser 压缩
  const minified = await minify(result.code, {
    compress: { drop_console: false, drop_debugger: true },
    mangle: true,
    format: { comments: false },
  });
  fs.writeFileSync(path.join(PROJECT_DIR, 'app.js'), minified.code);
  console.log(`[3/4] 压缩并写入 app.js: ${(minified.code.length / 1024).toFixed(1)} KB`);

  // ── 4. 构建 Tailwind CSS ──
  console.log('[4/4] 构建 Tailwind CSS...');
  execSync('npx tailwindcss -i src-input.css -o styles.css --minify', {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
  });

  const cssSize = fs.statSync(path.join(PROJECT_DIR, 'styles.css')).size;
  console.log(`\n=== 构建完成 ===`);
  console.log(`app.js:     ${(minified.code.length / 1024).toFixed(1)} KB`);
  console.log(`styles.css: ${(cssSize / 1024).toFixed(1)} KB`);
  console.log(`\n相比优化前节省：`);
  console.log(`  - Babel standalone CDN ~3 MB（完全移除）`);
  console.log(`  - Tailwind CDN ~400 KB → styles.css ${(cssSize / 1024).toFixed(1)} KB`);
  console.log(`  - 浏览器内实时编译时间：数秒 → 0`);
}

main().catch(err => {
  console.error('构建失败:', err.message);
  process.exit(1);
});
