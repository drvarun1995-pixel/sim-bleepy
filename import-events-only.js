#!/usr/bin/env node

/**
 * EVENT-ONLY IMPORT SCRIPT
 * 
 * This script imports ONLY events and links them to existing:
 * - Categories, Formats, Locations, Organizers, Speakers
 * 
 * It will NOT create any new master data - only events!
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
// FIND EXISTING DATA (NO CREATION)
// =====================================================

async function findExistingCategory(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error finding category "${name}":`, error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`⚠️ Category "${name}" not found in database. Event will be imported without this category.`);
        return null;
    }
    
    console.log(`✅ Found existing category: ${data.name} (ID: ${data.id})`);
    return data.id;
}

async function findExistingFormat(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('formats')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error finding format "${name}":`, error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`⚠️ Format "${name}" not found in database. Event will be imported without this format.`);
        return null;
    }
    
    console.log(`✅ Found existing format: ${data.name} (ID: ${data.id})`);
    return data.id;
}

async function findExistingLocation(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error finding location "${name}":`, error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`⚠️ Location "${name}" not found in database. Event will be imported without this location.`);
        return null;
    }
    
    console.log(`✅ Found existing location: ${data.name} (ID: ${data.id})`);
    return data.id;
}

async function findExistingOrganizer(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('organizers')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error finding organizer "${name}":`, error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`⚠️ Organizer "${name}" not found in database. Event will be imported without this organizer.`);
        return null;
    }
    
    console.log(`✅ Found existing organizer: ${data.name} (ID: ${data.id})`);
    return data.id;
}

async function findExistingSpeaker(name) {
    if (!name) return null;
    
    const { data, error } = await supabase
        .from('speakers')
        .select('id, name')
        .ilike('name', name.trim())
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error finding speaker "${name}":`, error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`⚠️ Speaker "${name}" not found in database. Event will be imported without this speaker.`);
        return null;
    }
    
    console.log(`✅ Found existing speaker: ${data.name} (ID: ${data.id})`);
    return data.id;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

function validateEvent(event) {
    const errors = [];
    
    if (!event.title || event.title.trim() === '') {
        errors.push('Missing title');
    }
    
    if (!event.date) {
        errors.push('Invalid date format');
    }
    
    if (!event.isAllDay && (!event.startTime || !event.endTime)) {
        errors.push('Invalid time format');
    }
    
    return errors;
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importEventsOnly(csvFilePath) {
    console.log('🚀 Starting EVENT-ONLY import process...\n');
    console.log('📋 This script will:');
    console.log('   ✅ Create events only');
    console.log('   ✅ Link to existing Categories, Formats, Locations, Organizers, Speakers');
    console.log('   ❌ NOT create any new master data\n');
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const processedEvents = [];
    const errors = [];
    
    // Process each line
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;
        
        // Parse CSV line (simple approach - may need more robust CSV parsing)
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length < 12) {
            errors.push(`Line ${i + 2}: Insufficient columns`);
            continue;
        }
        
        const [title, description, startDate, startTime, endDate, endTime, location, address, organizer, format, categories, speakers] = columns;
        
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
        
        const validationErrors = validateEvent(processedEvent);
        if (validationErrors.length > 0) {
            errors.push(`Line ${i + 2} (${processedEvent.title}): ${validationErrors.join(', ')}`);
            continue;
        }
        
        processedEvents.push(processedEvent);
    }
    
    console.log(`📊 Processed ${processedEvents.length} valid events`);
    console.log(`❌ ${errors.length} events had validation errors\n`);
    
    if (errors.length > 0) {
        console.log('❌ Validation Errors:');
        errors.forEach(error => console.log(`  ${error}`));
        console.log('\n');
    }
    
    console.log('🔍 Finding existing data links...\n');
    
    let importedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Import events one by one
    for (const event of processedEvents) {
        try {
            console.log(`\n📝 Processing: ${event.title} (${event.date})`);
            
            // Find existing data
            const locationId = await findExistingLocation(event.location);
            const organizerId = await findExistingOrganizer(event.organizer);
            const formatId = await findExistingFormat(event.format);
            
            // Find category IDs
            const categoryIds = [];
            for (const categoryName of event.categories) {
                const categoryId = await findExistingCategory(categoryName);
                if (categoryId) categoryIds.push(categoryId);
            }
            
            // Find speaker IDs
            const speakerIds = [];
            for (const speakerName of event.speakers) {
                const speakerId = await findExistingSpeaker(speakerName);
                if (speakerId) speakerIds.push(speakerId);
            }
            
            // Create the event
            const { data: newEvent, error: eventError } = await supabase
                .from('events')
                .insert({
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    start_time: event.startTime,
                    end_time: event.endTime,
                    is_all_day: event.isAllDay,
                    location_id: locationId,
                    organizer_id: organizerId,
                    format_id: formatId,
                    // author_id: 'imported-from-csv', // Remove this - let Supabase handle it
                    status: 'published',
                    attendees: 0
                })
                .select('id')
                .single();
            
            if (eventError) {
                console.error(`❌ Failed to create event "${event.title}":`, eventError.message);
                failedCount++;
                continue;
            }
            
            // Link categories
            for (const categoryId of categoryIds) {
                const { error: categoryError } = await supabase
                    .from('event_categories')
                    .insert({
                        event_id: newEvent.id,
                        category_id: categoryId
                    });
                
                if (categoryError) {
                    console.warn(`⚠️ Failed to link category:`, categoryError.message);
                }
            }
            
            // Link speakers
            for (const speakerId of speakerIds) {
                const { error: speakerError } = await supabase
                    .from('event_speakers')
                    .insert({
                        event_id: newEvent.id,
                        speaker_id: speakerId
                    });
                
                if (speakerError) {
                    console.warn(`⚠️ Failed to link speaker:`, speakerError.message);
                }
            }
            
            console.log(`✅ Successfully imported: ${event.title}`);
            console.log(`   📍 Location: ${event.location} ${locationId ? '(linked)' : '(not found)'}`);
            console.log(`   👥 Organizer: ${event.organizer} ${organizerId ? '(linked)' : '(not found)'}`);
            console.log(`   📋 Format: ${event.format} ${formatId ? '(linked)' : '(not found)'}`);
            console.log(`   🏷️ Categories: ${categoryIds.length}/${event.categories.length} linked`);
            console.log(`   🎤 Speakers: ${speakerIds.length}/${event.speakers.length} linked`);
            
            importedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to import event "${event.title}":`, error.message);
            failedCount++;
        }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successfully imported: ${importedCount} events`);
    console.log(`❌ Failed imports: ${failedCount} events`);
    console.log(`📊 Total processed: ${processedEvents.length} events`);
    console.log(`\n📋 Summary:`);
    console.log(`   • Only events were created`);
    console.log(`   • All master data (categories, formats, etc.) linked to existing records`);
    console.log(`   • No duplicate data created`);
}

// =====================================================
// CLI INTERFACE
// =====================================================

if (require.main === module) {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
        console.log('Usage: node import-events-only.js <csv-file-path>');
        console.log('Example: node import-events-only.js "C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv"');
        process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File not found: ${csvFilePath}`);
        process.exit(1);
    }
    
    importEventsOnly(csvFilePath)
        .then(() => {
            console.log('\n✅ Import process completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Import process failed:', error);
            process.exit(1);
        });
}

module.exports = { importEventsOnly };
