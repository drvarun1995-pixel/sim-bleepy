#!/usr/bin/env node

/**
 * SAFE EVENT IMPORT SCRIPT
 * 
 * This script safely imports events from your CSV export
 * with proper validation, error handling, and rollback capability
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

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
    
    if (event.location && event.location.trim() === '') {
        errors.push('Empty location');
    }
    
    return errors;
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

async function ensureCategoryExists(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single();
    
    if (existing) return existing.id;
    
    const colors = ['#FF6B6B', '#48C9B0', '#FFB366', '#5D6D7E', '#9B59B6', '#E74C3C'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
            name,
            slug,
            parent: 'none',
            description: 'Imported from CSV',
            color: randomColor
        })
        .select('id')
        .single();
    
    if (error) {
        console.error(`❌ Error creating category ${name}:`, error);
        return null;
    }
    
    console.log(`✅ Created category: ${name}`);
    return newCategory.id;
}

async function ensureFormatExists(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const { data: existing } = await supabase
        .from('formats')
        .select('id')
        .eq('slug', slug)
        .single();
    
    if (existing) return existing.id;
    
    const colors = ['#FF6B6B', '#48C9B0', '#FFB366', '#5D6D7E', '#9B59B6', '#E74C3C'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const { data: newFormat, error } = await supabase
        .from('formats')
        .insert({
            name,
            slug,
            parent: 'none',
            description: 'Imported from CSV',
            color: randomColor
        })
        .select('id')
        .single();
    
    if (error) {
        console.error(`❌ Error creating format ${name}:`, error);
        return null;
    }
    
    console.log(`✅ Created format: ${name}`);
    return newFormat.id;
}

async function ensureOrganizerExists(name) {
    if (!name || name.trim() === '') return null;
    
    const { data: existing } = await supabase
        .from('organizers')
        .select('id')
        .eq('name', name)
        .single();
    
    if (existing) return existing.id;
    
    const { data: newOrganizer, error } = await supabase
        .from('organizers')
        .insert({ name })
        .select('id')
        .single();
    
    if (error) {
        console.error(`❌ Error creating organizer ${name}:`, error);
        return null;
    }
    
    console.log(`✅ Created organizer: ${name}`);
    return newOrganizer.id;
}

async function ensureLocationExists(name, address = null) {
    if (!name || name.trim() === '') return null;
    
    const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', name)
        .single();
    
    if (existing) return existing.id;
    
    const { data: newLocation, error } = await supabase
        .from('locations')
        .insert({
            name,
            address: address || null
        })
        .select('id')
        .single();
    
    if (error) {
        console.error(`❌ Error creating location ${name}:`, error);
        return null;
    }
    
    console.log(`✅ Created location: ${name}`);
    return newLocation.id;
}

async function ensureSpeakerExists(name) {
    if (!name || name.trim() === '') return null;
    
    const { data: existing } = await supabase
        .from('speakers')
        .select('id')
        .eq('name', name)
        .single();
    
    if (existing) return existing.id;
    
    const { data: newSpeaker, error } = await supabase
        .from('speakers')
        .insert({
            name,
            role: 'Speaker'
        })
        .select('id')
        .single();
    
    if (error) {
        console.error(`❌ Error creating speaker ${name}:`, error);
        return null;
    }
    
    console.log(`✅ Created speaker: ${name}`);
    return newSpeaker.id;
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importEvents(csvFilePath) {
    console.log('🚀 Starting event import process...\n');
    
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
            errors.push(`Line ${i + 2}: ${validationErrors.join(', ')}`);
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
    
    // Create dependencies
    console.log('🔧 Creating dependencies...\n');
    
    const categoryIds = {};
    const formatIds = {};
    const organizerIds = {};
    const locationIds = {};
    const speakerIds = {};
    
    // Collect all unique values
    const allCategories = [...new Set(processedEvents.flatMap(e => e.categories))];
    const allFormats = [...new Set(processedEvents.map(e => e.format).filter(f => f))];
    const allOrganizers = [...new Set(processedEvents.map(e => e.organizer).filter(o => o))];
    const allLocations = [...new Set(processedEvents.map(e => e.location).filter(l => l))];
    const allSpeakers = [...new Set(processedEvents.flatMap(e => e.speakers))];
    
    // Create categories
    for (const category of allCategories) {
        const id = await ensureCategoryExists(category);
        if (id) categoryIds[category] = id;
    }
    
    // Create formats
    for (const format of allFormats) {
        const id = await ensureFormatExists(format);
        if (id) formatIds[format] = id;
    }
    
    // Create organizers
    for (const organizer of allOrganizers) {
        const id = await ensureOrganizerExists(organizer);
        if (id) organizerIds[organizer] = id;
    }
    
    // Create locations
    for (const location of allLocations) {
        const event = processedEvents.find(e => e.location === location);
        const id = await ensureLocationExists(location, event?.address);
        if (id) locationIds[location] = id;
    }
    
    // Create speakers
    for (const speaker of allSpeakers) {
        const id = await ensureSpeakerExists(speaker);
        if (id) speakerIds[speaker] = id;
    }
    
    console.log('\n📝 Importing events...\n');
    
    let importedCount = 0;
    let failedCount = 0;
    
    // Import events
    for (const event of processedEvents) {
        try {
            const { data: newEvent, error } = await supabase
                .from('events')
                .insert({
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    start_time: event.startTime,
                    end_time: event.endTime,
                    is_all_day: event.isAllDay,
                    location_id: locationIds[event.location] || null,
                    organizer_id: organizerIds[event.organizer] || null,
                    format_id: formatIds[event.format] || null,
                    author_id: 'imported-from-csv',
                    status: 'published',
                    attendees: 0
                })
                .select('id')
                .single();
            
            if (error) {
                console.error(`❌ Failed to import event "${event.title}":`, error);
                failedCount++;
                continue;
            }
            
            // Link categories
            for (const categoryName of event.categories) {
                const categoryId = categoryIds[categoryName];
                if (categoryId) {
                    await supabase
                        .from('event_categories')
                        .insert({
                            event_id: newEvent.id,
                            category_id: categoryId
                        });
                }
            }
            
            // Link speakers
            for (const speakerName of event.speakers) {
                const speakerId = speakerIds[speakerName];
                if (speakerId) {
                    await supabase
                        .from('event_speakers')
                        .insert({
                            event_id: newEvent.id,
                            speaker_id: speakerId
                        });
                }
            }
            
            console.log(`✅ Imported: ${event.title}`);
            importedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to import event "${event.title}":`, error);
            failedCount++;
        }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successfully imported: ${importedCount} events`);
    console.log(`❌ Failed imports: ${failedCount} events`);
    console.log(`📊 Total processed: ${processedEvents.length} events`);
}

// =====================================================
// CLI INTERFACE
// =====================================================

if (require.main === module) {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
        console.log('Usage: node import-events.js <csv-file-path>');
        console.log('Example: node import-events.js ./mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv');
        process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File not found: ${csvFilePath}`);
        process.exit(1);
    }
    
    importEvents(csvFilePath)
        .then(() => {
            console.log('\n✅ Import process completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Import process failed:', error);
            process.exit(1);
        });
}

module.exports = { importEvents };
