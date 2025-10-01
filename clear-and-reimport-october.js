#!/usr/bin/env node

/**
 * CLEAR AND RE-IMPORT OCTOBER 2025 EVENTS
 * 
 * This script:
 * 1. Clears all existing data
 * 2. Re-imports October 2025 events with proper "All Day" handling (9AM-5PM)
 * 3. Includes all events including Grand Rounds
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
        return null; // We'll handle this separately
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
// CLEAR DATA FUNCTION
// =====================================================

async function clearAllData() {
    console.log('🗑️ Clearing all existing data...\n');
    
    try {
        // Clear event-speaker relationships first
        const { error: eventSpeakerError } = await supabase
            .from('event_speakers')
            .delete()
            .neq('event_id', '00000000-0000-0000-0000-000000000000');
        
        if (eventSpeakerError) {
            console.error('❌ Error clearing event-speaker relationships:', eventSpeakerError.message);
        } else {
            console.log('✅ Event-speaker relationships cleared');
        }
        
        // Clear events
        const { error: eventsError } = await supabase
            .from('events')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (eventsError) {
            console.error('❌ Error clearing events:', eventsError.message);
        } else {
            console.log('✅ Events cleared');
        }
        
        // Clear categories
        const { error: categoriesError } = await supabase
            .from('categories')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (categoriesError) {
            console.error('❌ Error clearing categories:', categoriesError.message);
        } else {
            console.log('✅ Categories cleared');
        }
        
        // Clear formats
        const { error: formatsError } = await supabase
            .from('formats')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (formatsError) {
            console.error('❌ Error clearing formats:', formatsError.message);
        } else {
            console.log('✅ Formats cleared');
        }
        
        // Clear locations
        const { error: locationsError } = await supabase
            .from('locations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (locationsError) {
            console.error('❌ Error clearing locations:', locationsError.message);
        } else {
            console.log('✅ Locations cleared');
        }
        
        // Clear organizers
        const { error: organizersError } = await supabase
            .from('organizers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (organizersError) {
            console.error('❌ Error clearing organizers:', organizersError.message);
        } else {
            console.log('✅ Organizers cleared');
        }
        
        // Clear speakers
        const { error: speakersError } = await supabase
            .from('speakers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (speakersError) {
            console.error('❌ Error clearing speakers:', speakersError.message);
        } else {
            console.log('✅ Speakers cleared');
        }
        
        console.log('\n✅ All data cleared successfully!\n');
        
    } catch (error) {
        console.error('❌ Unexpected error during cleanup:', error.message);
    }
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importOctober2025Events() {
    console.log('🚀 Starting October 2025 events import with All Day handling...\n');
    
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
            
            const isAllDay = startTime?.toUpperCase() === 'ALL DAY' || endTime?.toUpperCase() === 'ALL DAY';
            
            console.log(`📅 Found October 2025 event: ${title} on ${convertedDate} ${isAllDay ? '(All Day)' : ''}`);
            
            const processedEvent = {
                title: title.trim(),
                description: cleanHtmlContent(description),
                date: convertedDate,
                startTime: isAllDay ? '09:00:00' : convertTimeFormat(startTime), // Set All Day to 9AM
                endTime: isAllDay ? '17:00:00' : convertTimeFormat(endTime), // Set All Day to 5PM
                isAllDay: isAllDay,
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
        console.log(`     Time: ${event.startTime} - ${event.endTime} ${event.isAllDay ? '(All Day converted to 9AM-5PM)' : ''}`);
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
        .gte('date', '2025-10-01')
        .lt('date', '2025-11-01')
        .order('date', { ascending: true });
    
    if (sampleEvents && sampleEvents.length > 0) {
        sampleEvents.forEach(event => {
            console.log(`  • ${event.title}: ${event.date} ${event.start_time} - ${event.end_time}`);
        });
    } else {
        console.log('  No events found in database');
    }
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
    await clearAllData();
    await importOctober2025Events();
}

// Run the complete process
main().catch(console.error);
