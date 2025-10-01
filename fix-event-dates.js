#!/usr/bin/env node

/**
 * FIX EVENT DATES SCRIPT
 * 
 * This script fixes the incorrectly imported event dates in the database
 * by re-importing with proper CSV parsing
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
// MAIN FUNCTION
// =====================================================

async function fixEventDates() {
    console.log('🚀 Starting event date fix...\n');
    
    // First, clear all existing events
    console.log('🗑️ Clearing existing events...');
    const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all events
    
    if (deleteError) {
        console.error('❌ Error clearing events:', deleteError);
        return;
    }
    
    console.log('✅ Existing events cleared\n');
    
    // Now import with correct parsing
    const csvPath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv';
    
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Processing ${lines.length} lines from CSV file`);
    
    const processedEvents = [];
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
                // Skip lines with insufficient columns
                continue;
            }
            
            const [title, description, startDate, startTime, endDate, endTime, location, address, organizer, format, categories, speakers] = columns;
            
            // Skip if title or date is missing
            if (!title?.trim() || !startDate) {
                continue;
            }
            
            const processedEvent = {
                title: title.trim(),
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
                continue;
            }
            
            processedEvents.push(processedEvent);
            
        } catch (error) {
            // Skip problematic lines
            continue;
        }
    }
    
    console.log(`📊 Found ${processedEvents.length} valid events to import\n`);
    
    // Now import each event
    let successCount = 0;
    let errorCount = 0;
    
    for (const event of processedEvents) {
        try {
            // Find related data
            const category = await findExistingCategory(event.categories[0]);
            const format = await findExistingFormat(event.format);
            const location = await findExistingLocation(event.location);
            const organizer = await findExistingOrganizer(event.organizer);
            const speakerData = await findExistingSpeakers(event.speakers);
            
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
            
            successCount++;
            
            if (successCount % 10 === 0) {
                console.log(`✅ Imported ${successCount} events...`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing event "${event.title}":`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successfully imported: ${successCount} events`);
    console.log(`❌ Failed to import: ${errorCount} events`);
    
    // Show sample of imported events
    console.log('\n🔍 Sample imported events:');
    const { data: sampleEvents } = await supabase
        .from('events')
        .select('title, date, start_time, end_time')
        .order('date', { ascending: true })
        .limit(5);
    
    if (sampleEvents) {
        sampleEvents.forEach(event => {
            console.log(`  • ${event.title}: ${event.date} ${event.start_time || 'All Day'}`);
        });
    }
}

// Run the fix
fixEventDates().catch(console.error);
