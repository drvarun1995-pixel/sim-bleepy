#!/usr/bin/env node

/**
 * OCTOBER 2025 EVENTS IMPORT SCRIPT
 * 
 * This script imports ONLY October 2025 events from the CSV file
 * with proper CSV parsing to ensure correct dates
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
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
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
// CREATE OR FIND DATA FUNCTIONS
// =====================================================

async function createOrFindCategory(name) {
    if (!name) return null;
    
    // First try to find existing
    const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (existing) return existing;
    
    // Create new if not found
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
            name: name.trim(),
            slug: slug,
            description: '',
            color: '#3B82F6'
        })
        .select()
        .single();
    
    if (error) {
        console.warn(`⚠️ Failed to create category "${name}":`, error.message);
        return null;
    }
    
    console.log(`✅ Created category: ${name}`);
    return newCategory;
}

async function createOrFindFormat(name) {
    if (!name) return null;
    
    // First try to find existing
    const { data: existing } = await supabase
        .from('formats')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (existing) return existing;
    
    // Create new if not found
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    const { data: newFormat, error } = await supabase
        .from('formats')
        .insert({
            name: name.trim(),
            slug: slug,
            description: '',
            color: '#10B981'
        })
        .select()
        .single();
    
    if (error) {
        console.warn(`⚠️ Failed to create format "${name}":`, error.message);
        return null;
    }
    
    console.log(`✅ Created format: ${name}`);
    return newFormat;
}

async function createOrFindLocation(name, address = '') {
    if (!name) return null;
    
    // First try to find existing
    const { data: existing } = await supabase
        .from('locations')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (existing) return existing;
    
    // Create new if not found
    const { data: newLocation, error } = await supabase
        .from('locations')
        .insert({
            name: name.trim(),
            address: address.trim() || null
        })
        .select()
        .single();
    
    if (error) {
        console.warn(`⚠️ Failed to create location "${name}":`, error.message);
        return null;
    }
    
    console.log(`✅ Created location: ${name}`);
    return newLocation;
}

async function createOrFindOrganizer(name) {
    if (!name) return null;
    
    // First try to find existing
    const { data: existing } = await supabase
        .from('organizers')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (existing) return existing;
    
    // Create new if not found
    const { data: newOrganizer, error } = await supabase
        .from('organizers')
        .insert({
            name: name.trim()
        })
        .select()
        .single();
    
    if (error) {
        console.warn(`⚠️ Failed to create organizer "${name}":`, error.message);
        return null;
    }
    
    console.log(`✅ Created organizer: ${name}`);
    return newOrganizer;
}

async function createOrFindSpeakers(speakerNames) {
    if (!speakerNames || speakerNames.length === 0) return [];
    
    const speakers = [];
    
    for (const speakerName of speakerNames) {
        // First try to find existing
        const { data: existing } = await supabase
            .from('speakers')
            .select('id, name')
            .ilike('name', speakerName.trim())
            .single();
        
        if (existing) {
            speakers.push(existing);
        } else {
            // Create new if not found
            const { data: newSpeaker, error } = await supabase
                .from('speakers')
                .insert({
                    name: speakerName.trim(),
                    role: 'Speaker'
                })
                .select()
                .single();
            
            if (error) {
                console.warn(`⚠️ Failed to create speaker "${speakerName}":`, error.message);
            } else {
                console.log(`✅ Created speaker: ${speakerName}`);
                speakers.push(newSpeaker);
            }
        }
    }
    
    return speakers;
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importOctober2025Events() {
    console.log('🚀 Starting October 2025 events import...\n');
    
    const csvPath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv';
    
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        process.exit(1);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Found ${lines.length} lines in CSV file`);
    
    const octoberEvents = [];
    const errors = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            // Skip lines that look like HTML/CSS
            if (line.includes('.kb-button') || line.includes('ul.menu') || line.includes('.wp-block')) {
                continue;
            }
            
            // Use proper CSV parsing
            const columns = parseCSVLine(line);
            
            if (columns.length < 12) {
                continue;
            }
            
            const [title, description, startDate, startTime, endDate, endTime, location, address, organizer, format, categories, speakers] = columns;
            
            // Skip if title or date is missing
            if (!title?.trim() || !startDate) {
                continue;
            }
            
            const convertedDate = convertDateFormat(startDate);
            if (!convertedDate) {
                continue;
            }
            
            // Check if it's October 2025
            if (!convertedDate.startsWith('2025-10-')) {
                continue; // Skip non-October 2025 events
            }
            
            console.log(`📅 Found October 2025 event: ${title} on ${convertedDate}`);
            
            const processedEvent = {
                title: title.trim(),
                description: cleanHtmlContent(description),
                date: convertedDate,
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
            
            octoberEvents.push(processedEvent);
            
        } catch (error) {
            // Skip problematic lines
            continue;
        }
    }
    
    console.log(`\n📊 Found ${octoberEvents.length} October 2025 events to import\n`);
    
    if (octoberEvents.length === 0) {
        console.log('❌ No October 2025 events found in the CSV file');
        return;
    }
    
    // Show the events we found
    console.log('🔍 October 2025 events found:');
    octoberEvents.forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event.title}`);
        console.log(`     Date: ${event.date}`);
        console.log(`     Time: ${event.startTime || 'All Day'} - ${event.endTime || 'All Day'}`);
        console.log(`     Location: ${event.location}`);
        console.log(`     Organizer: ${event.organizer}`);
        console.log(`     Format: ${event.format}`);
        console.log('');
    });
    
    // Now import each event
    let successCount = 0;
    let errorCount = 0;
    
    console.log('🚀 Starting import process...\n');
    
    for (const event of octoberEvents) {
        try {
            console.log(`📝 Importing: ${event.title}...`);
            
            // Create or find related data
            const category = await createOrFindCategory(event.categories[0]);
            const format = await createOrFindFormat(event.format);
            const location = await createOrFindLocation(event.location, event.address);
            const organizer = await createOrFindOrganizer(event.organizer);
            const speakerData = await createOrFindSpeakers(event.speakers);
            
            // Create event
            const eventData = {
                title: event.title,
                description: event.description || '',
                date: event.date,
                start_time: event.startTime,
                end_time: event.endTime,
                location_id: location?.id || null,
                organizer_id: organizer?.id || null,
                category_id: category?.id || null,
                format_id: format?.id || null,
                status: 'published',
                attendees: 0
            };
            
            const { data: newEvent, error: eventError } = await supabase
                .from('events')
                .insert(eventData)
                .select()
                .single();
            
            if (eventError) {
                console.error(`❌ Failed to create event "${event.title}":`, eventError.message);
                errorCount++;
                continue;
            }
            
            // Link speakers if any
            if (speakerData.length > 0 && newEvent) {
                const speakerLinks = speakerData.map(speaker => ({
                    event_id: newEvent.id,
                    speaker_id: speaker.id
                }));
                
                const { error: speakerError } = await supabase
                    .from('event_speakers')
                    .insert(speakerLinks);
                
                if (speakerError) {
                    console.warn(`⚠️ Failed to link speakers for "${event.title}":`, speakerError.message);
                }
            }
            
            console.log(`✅ Successfully imported: ${event.title}`);
            successCount++;
            
        } catch (error) {
            console.error(`❌ Error processing event "${event.title}":`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n🎉 October 2025 import completed!`);
    console.log(`✅ Successfully imported: ${successCount} events`);
    console.log(`❌ Failed to import: ${errorCount} events`);
    
    // Show sample of imported events
    console.log('\n🔍 Sample imported October 2025 events:');
    const { data: sampleEvents } = await supabase
        .from('events')
        .select('title, date, start_time, end_time')
        .like('date', '2025-10-%')
        .order('date', { ascending: true });
    
    if (sampleEvents && sampleEvents.length > 0) {
        sampleEvents.forEach(event => {
            console.log(`  • ${event.title}: ${event.date} ${event.start_time || 'All Day'}`);
        });
    } else {
        console.log('  No events found in database');
    }
}

// Run the import
importOctober2025Events().catch(console.error);
