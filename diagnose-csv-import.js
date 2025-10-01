#!/usr/bin/env node

/**
 * DIAGNOSTIC SCRIPT
 * 
 * This script analyzes the CSV file to understand the date format issues
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const csvPath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv';

console.log('🔍 Diagnosing CSV import issues...\n');

try {
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 CSV file has ${lines.length} lines`);
    
    // Show header
    console.log('\n📋 Header (first line):');
    console.log(lines[0]);
    
    // Show first few data lines
    console.log('\n📋 First 5 data lines:');
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        if (lines[i].trim()) {
            console.log(`Line ${i + 1}:`, lines[i]);
        }
    }
    
    // Parse first few lines to see column alignment
    console.log('\n🔍 Column analysis (first 3 events):');
    for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        console.log(`\nLine ${i + 1} raw:`, line);
        
        // Simple split (current approach)
        const simpleColumns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        console.log(`Simple split (${simpleColumns.length} columns):`);
        simpleColumns.forEach((col, idx) => {
            console.log(`  ${idx}: "${col}"`);
        });
        
        // Check if Start Date is in the expected position
        if (simpleColumns.length >= 3) {
            const startDate = simpleColumns[2];
            console.log(`Start Date (column 2): "${startDate}"`);
            
            // Check if it looks like a date
            if (startDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                console.log('✅ Looks like DD/MM/YYYY format');
            } else if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                console.log('✅ Looks like YYYY-MM-DD format');
            } else {
                console.log('❌ Does not look like a date');
            }
        }
    }
    
} catch (error) {
    console.error('❌ Error reading CSV file:', error.message);
}
