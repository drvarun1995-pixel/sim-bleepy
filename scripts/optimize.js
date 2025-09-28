#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting performance optimization...');

// 1. Clear all cache directories
const cacheDirs = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'dist'
];

cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`🗑️  Clearing cache: ${dir}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// 2. Check for large files
const checkLargeFiles = (dir, maxSize = 1024 * 1024) => { // 1MB
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !file.startsWith('.')) {
      checkLargeFiles(filePath, maxSize);
    } else if (stats.isFile() && stats.size > maxSize) {
      console.log(`⚠️  Large file detected: ${filePath} (${Math.round(stats.size / 1024 / 1024)}MB)`);
    }
  });
};

console.log('📊 Checking for large files...');
checkLargeFiles('./public');
checkLargeFiles('./components');
checkLargeFiles('./app');

// 3. Generate bundle analyzer command
console.log('\n📦 To analyze bundle size, run:');
console.log('npm install --save-dev @next/bundle-analyzer');
console.log('ANALYZE=true npm run build');

console.log('\n✅ Performance optimization complete!');
console.log('💡 Additional recommendations:');
console.log('   - Use dynamic imports for heavy components');
console.log('   - Optimize images with next/image');
console.log('   - Enable compression in production');
console.log('   - Use CDN for static assets');
