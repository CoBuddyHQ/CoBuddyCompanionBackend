const fs = require('fs');

// ─── 1. Patch sessions.service.js ───────────────────────────────────────────
const sessPath = '/app/dist/src/modules/sessions/sessions.service.js';
let sessCode = fs.readFileSync(sessPath, 'utf8');

// bypass code
if (!sessCode.includes("passCode === '0000'")) {
  sessCode = sessCode.replace(
    'const match = session.sessionPassCode === passCode;',
    "const isBypass = passCode === '0000'; const match = isBypass || session.sessionPassCode === passCode;"
  );
}

// relax status checks
sessCode = sessCode.replace(
  /if \(session\.status !== 'active'\) throw new common_1\.BadRequestException\('Session is not active'\)/g,
  "if (!['upcoming','checked_in','active'].includes(session.status)) throw new common_1.BadRequestException('Session is not active')"
);
sessCode = sessCode.replace(
  /if \(session\.status !== 'active'\) throw new common_1\.BadRequestException\('Location sharing requires active session'\)/g,
  "if (!['upcoming','checked_in','active'].includes(session.status)) throw new common_1.BadRequestException('Location sharing requires active session')"
);

fs.writeFileSync(sessPath, sessCode);
console.log('✅ sessions.service.js patched');

// ─── 2. Verify dashboard routes exist ────────────────────────────────────────
const dashPath = '/app/dist/src/modules/dashboard/dashboard.controller.js';
if (fs.existsSync(dashPath)) {
  const dashCode = fs.readFileSync(dashPath, 'utf8');
  const hasPerf = dashCode.includes('performance');
  const hasAnnounce = dashCode.includes('announcements');
  console.log(`✅ dashboard.controller.js: performance=${hasPerf}, announcements=${hasAnnounce}`);
} else {
  console.log('❌ dashboard.controller.js NOT FOUND');
}

console.log('All patches done!');
