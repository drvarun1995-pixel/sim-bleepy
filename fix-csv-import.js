#!/usr/bin/env node

/**
 * FIXED CSV IMPORT SCRIPT
 * 
 * This script properly parses CSV with quoted fields and fixes the date import
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// PROPER CSV PARSING
// =====================================================

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function convertDateFormat(dateStr) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (!dateStr) return null;
    
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
    }
    return null;
}

function convertTimeFormat(timeStr) {
    if (!timeStr || timeStr.toUpperCase() === 'ALL DAY') {
        return null;
    }
    
    try {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        
        let hour24 = parseInt(hours);
        if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
    } catch (error) {
        console.warn(`⚠️ Invalid time format: ${timeStr}`);
        return null;
    }
}

function cleanHtmlContent(text) {
    if (!text) return '';
    
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&') // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

function parseCategories(categoryStr) {
    if (!categoryStr) return [];
    return categoryStr.split(',').map(cat => cat.trim()).filter(cat => cat);
}

function parseSpeakers(speakerStr) {
    if (!speakerStr) return [];
    return speakerStr.split(',').map(speaker => speaker.trim()).filter(speaker => speaker);
}

// =====================================================
// FIND EXISTING DATA
// =====================================================

async function findExistingCategory(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error || !data) return null;
    return data;
}

async function findExistingFormat(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('formats')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error || !data) return null;
    return data;
}

async function findExistingLocation(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error || !data) return null;
    return data;
}

async function findExistingOrganizer(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('organizers')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error || !data) return null;
    return data;
}

async function findExistingSpeakers(speakerNames) {
    if (!speakerNames || speakerNames.length === 0) return [];
    
    const { data, error } = await supabase
        .from('speakers')
        .select('id, name')
        .in('name', speakerNames);
    
    if (error || !data) return [];
    return data;
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importEventsFromCSV() {
    console.log('🚀 Starting FIXED CSV import...\n');
    
    const csvPath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv';
    
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        process.exit(1);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Found ${lines.length} lines in CSV file`);
    
    const processedEvents = [];
    const errors = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            // Use proper CSV parsing
            const columns = parseCSVLine(line);
            
            if (columns.length < 12) {
                errors.push(`Line ${i + 1}: Insufficient columns (${columns.length} found, 12 expected)`);
                continue;
            }
            
            const [title, description, startDate, startTime, endDate, endTime, location, address, organizer, format, categories, speakers] = columns;
            
            console.log(`\nProcessing line ${i + 1}: "${title}"`);
            console.log(`  Start Date: "${startDate}" -> ${convertDateFormat(startDate)}`);
            console.log(`  Start Time: "${startTime}" -> ${convertTimeFormat(startTime)}`);
            console.log(`  End Time: "${endTime}" -> ${convertTimeFormat(endTime)}`);
            
            const processedEvent = {
                title: title?.trim(),
                description: cleanHtmlContent(description),
                date: convertDateFormat(startDate),
                startTime: convertTimeFormat(startTime),
                endTime: convertTimeFormat(endTime),
                isAllDay: startTime?.toUpperCase() === 'ALL DAY' || endTime?.toUpperCase() === 'ALL DAY',
                location: location?.trim(),
                address: address?.trim(),
                organizer: organizer?.trim(),
                format: format?.trim(),
                categories: parseCategories(categories),
                speakers: parseSpeakers(speakers)
            };
            
            // Validate required fields
            if (!processedEvent.title || !processedEvent.date) {
                errors.push(`Line ${i + 1}: Missing title or date`);
                continue;
            }
            
            processedEvents.push(processedEvent);
            
        } catch (error) {
            errors.push(`Line ${i + 1}: Parsing error - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Processed ${processedEvents.length} valid events`);
    console.log(`❌ ${errors.length} events had errors\n`);
    
    if (errors.length > 0) {
        console.log('❌ Errors:');
        errors.slice(0, 10).forEach(error => console.log(`  ${error}`));
        if (errors.length > 10) {
            console.log(`  ... and ${errors.length - 10} more errors`);
        }
        console.log('');
    }
    
    // Show sample of processed events
    console.log('🔍 Sample processed events:');
    processedEvents.slice(0, 3).forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event.title}`);
        console.log(`     Date: ${event.date}`);
        console.log(`     Time: ${event.startTime} - ${event.endTime}`);
        console.log(`     Location: ${event.location}`);
        console.log(`     Organizer: ${event.organizer}`);
        console.log(`     Format: ${event.format}`);
    });
    
    console.log('\n✅ CSV parsing completed successfully!');
    console.log('📝 Next step: Run the actual import with these corrected dates');
}

// Run the diagnostic
importEventsFromCSV().catch(console.error);
