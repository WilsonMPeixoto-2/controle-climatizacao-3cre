import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);

const pkgPath = 'package.json';
const pkg = JSON.parse(read(pkgPath));

if (pkg.dependencies?.['@supabase/supabase-js']) {
  execFileSync('npm', ['uninstall', '@supabase/supabase-js'], { stdio: 'inherit' });
}
if (pkg.devDependencies?.supabase) {
  execFileSync('npm', ['uninstall', '--save-dev', 'supabase'], { stdio: 'inherit' });
}

const refreshedPkg = JSON.parse(read(pkgPath));
delete refreshedPkg.scripts['db:types'];
write(pkgPath, `${JSON.stringify(refreshedPkg, null, 2)}\n`);
execFileSync('npm', ['install', '--package-lock-only'], { stdio: 'inherit' });

const vitePath = 'vite.config.js';
let vite = read(vitePath);
vite = vite.replace(
  "if (id.includes('@supabase')) return 'supabase-vendor'",
  "if (id.includes('firebase') || id.includes('@firebase')) return 'firebase-vendor'"
);
write(vitePath, vite);

const ciPath = '.github/workflows/ci.yml';
let ci = read(ciPath);
ci = ci.replace(
  "      VITE_SUPABASE_URL: ''\n      VITE_SUPABASE_KEY: ''",
  "      VITE_FIREBASE_API_KEY: ''\n      VITE_FIREBASE_PROJECT_ID: ''\n      VITE_FIREBASE_APP_ID: ''"
);
write(ciPath, ci);

write(
  '.env.example',
  `# Firebase / Firestore — produção e desenvolvimento\n# As chaves de configuração do app Web não são segredos; não inclua credenciais administrativas.\n\nVITE_FIREBASE_API_KEY=\nVITE_FIREBASE_AUTH_DOMAIN=\nVITE_FIREBASE_PROJECT_ID=\nVITE_FIREBASE_APP_ID=\nVITE_FIREBASE_MESSAGING_SENDER_ID=\n\n# Cloud Storage fica desativado nesta fase Spark.\n`
);

const cssPath = 'src/index.css';
let css = read(cssPath);
const marker = '/* Release 2026-08: contraste WCAG do tema claro */';
if (!css.includes(marker)) {
  css += `\n\n${marker}\nhtml:not(.dark-theme) {\n  --primary-readable: hsl(201, 95%, 26%);\n  --text-light-readable: hsl(215, 22%, 31%);\n}\n\nhtml:not(.dark-theme) .sidebar-brand-text span,\nhtml:not(.dark-theme) .summary-badge-editorial,\nhtml:not(.dark-theme) .priority-ticket-link,\nhtml:not(.dark-theme) .btn-secondary,\nhtml:not(.dark-theme) .theme-toggle-header,\nhtml:not(.dark-theme) .sidebar-footer [style*='var(--primary)'] {\n  color: var(--primary-readable) !important;\n}\n\nhtml:not(.dark-theme) .sidebar-footer {\n  color: var(--text-light-readable);\n}\n`;
}
write(cssPath, css);

console.log('Release hardening mutations applied.');
