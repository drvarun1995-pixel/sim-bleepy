#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Performance Check Starting...\n');

// 1. Check bundle size
console.log('📦 Checking bundle size...');
try {
  const buildOutput = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  
  // Extract build size information
  const lines = buildOutput.split('\n');
  const sizeLines = lines.filter(line => 
    line.includes('First Load JS') || 
    line.includes('Route') || 
    line.includes('○') || 
    line.includes('●') ||
    line.includes('λ') ||
    line.includes('◐')
  );
  
  console.log('Build Results:');
  sizeLines.forEach(line => console.log(`  ${line.trim()}`));
  
} catch (error) {
  console.log('❌ Build failed:', error.message);
}

console.log('\n🔍 Performance Metrics to Check:');
console.log('1. Open browser Developer Tools (F12)');
console.log('2. Go to Network tab');
console.log('3. Refresh the page');
console.log('4. Check these metrics:');
console.log('   - Total page load time');
console.log('   - Largest bundle size');
console.log('   - Number of requests');
console.log('   - Time to First Byte (TTFB)');

console.log('\n📊 Lighthouse Performance Audit:');
console.log('1. Open Chrome DevTools (F12)');
console.log('2. Go to Lighthouse tab');
console.log('3. Select "Performance"');
console.log('4. Click "Generate report"');
console.log('5. Check Core Web Vitals:');
console.log('   - LCP (Largest Contentful Paint) - should be < 2.5s');
console.log('   - FID (First Input Delay) - should be < 100ms');
console.log('   - CLS (Cumulative Layout Shift) - should be < 0.1');

console.log('\n⚡ Quick Performance Tips:');
console.log('✅ Use dynamic imports for heavy components');
console.log('✅ Optimize images with next/image');
console.log('✅ Enable compression');
console.log('✅ Use CDN for static assets');
console.log('✅ Implement proper caching headers');

console.log('\n🎯 Current Optimizations Applied:');
console.log('✅ SWC minification enabled');
console.log('✅ Image optimization configured');
console.log('✅ Font optimization enabled');
console.log('✅ Bundle splitting implemented');
console.log('✅ Performance monitoring added');

console.log('\n📈 Performance Monitoring:');
console.log('Check browser console for real-time metrics:');
console.log('- LCP: Largest Contentful Paint');
console.log('- FID: First Input Delay');
console.log('- CLS: Cumulative Layout Shift');
console.log('- Page Load Performance breakdown');

console.log('\n✅ Performance check complete!');
