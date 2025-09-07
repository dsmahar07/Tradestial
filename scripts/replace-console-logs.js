/**
 * Script to replace console.log statements with logger
 * Run: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug(',
    importNeeded: true
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    importNeeded: true
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    importNeeded: true
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    importNeeded: true
  }
];

// Files to process
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    'src/lib/logger.ts',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}'
  ]
});

let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  let needsImport = false;

  replacements.forEach(({ pattern, replacement, importNeeded }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      if (importNeeded) needsImport = true;
    }
  });

  if (modified) {
    // Add import if needed and not already present
    if (needsImport && !content.includes("from '@/lib/logger'")) {
      // Add import after 'use client' or at the beginning
      if (content.includes("'use client'")) {
        content = content.replace(
          "'use client'",
          "'use client'\n\nimport { logger } from '@/lib/logger'"
        );
      } else {
        content = `import { logger } from '@/lib/logger'\n\n${content}`;
      }
    }

    fs.writeFileSync(file, content);
    totalReplacements++;
    console.log(`✅ Updated: ${file}`);
  }
});

console.log(`\n🎉 Replaced console statements in ${totalReplacements} files`);
