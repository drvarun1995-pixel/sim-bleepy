#!/usr/bin/env node

/**
 * CLEAR AND IMPORT ALL EVENTS FROM EXCEL
 * 
 * This script:
 * 1. Clears all existing data
 * 2. Imports ALL events from the Excel file with proper "All Day" handling (9AM-5PM)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

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

function convertExcelDateToISO(excelDate) {
    // Excel dates are numbers representing days since 1900-01-01
    // JavaScript Date constructor expects milliseconds since 1970-01-01
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

function convertTimeFormat(timeStr) {
    if (!timeStr || timeStr.toUpperCase() === 'ALL DAY') {
        return null; // We'll handle this separately
    }
    
    // Handle different time formats
    if (typeof timeStr === 'number') {
        // Excel time as decimal (e.g., 0.5 = 12:00 PM)
        const hours = Math.floor(timeStr * 24);
        const minutes = Math.floor((timeStr * 24 - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    
    if (typeof timeStr === 'string') {
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
    
    return null;
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

async function importAllEventsFromExcel() {
    console.log('🚀 Starting ALL events import from Excel file...\n');
    
    const excelPath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.xlsx';
    
    if (!fs.existsSync(excelPath)) {
        console.error('❌ Excel file not found at:', excelPath);
        process.exit(1);
    }
    
    console.log('📊 Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${data.length} rows in Excel file`);
    
    const allEvents = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
            // Get the data from the row
            const title = row['Title'] || row['title'] || '';
            const description = row['Description'] || row['description'] || '';
            const startDate = row['Start Date'] || row['start_date'] || row['StartDate'] || '';
            const startTime = row['Start Time'] || row['start_time'] || row['StartTime'] || '';
            const endDate = row['End Date'] || row['end_date'] || row['EndDate'] || '';
            const endTime = row['End Time'] || row['end_time'] || row['EndTime'] || '';
            const location = row['Location'] || row['location'] || '';
            const address = row['Address'] || row['address'] || '';
            const organizer = row['Organizer'] || row['organizer'] || '';
            const format = row['Format'] || row['format'] || '';
            const categories = row['Categories'] || row['categories'] || '';
            const speakers = row['Speakers'] || row['speakers'] || '';
            
            // Skip if title or date is missing
            if (!title || !startDate) {
                continue;
            }
            
            // Convert date to ISO format
            let convertedDate;
            if (typeof startDate === 'number') {
                // Excel date number
                convertedDate = convertExcelDateToISO(startDate);
            } else if (typeof startDate === 'string') {
                // Try to parse as YYYY-MM-DD first
                const isoMatch = startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (isoMatch) {
                    convertedDate = startDate; // Already in correct format
                } else {
                    // Try to parse as DD/MM/YYYY
                    const ddmmMatch = startDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                    if (ddmmMatch) {
                        const [, day, month, year] = ddmmMatch;
                        convertedDate = `${year}-${month}-${day}`;
                    } else {
                        continue; // Skip if can't parse date
                    }
                }
            } else {
                continue; // Skip if date is not recognizable
            }
            
            const isAllDay = startTime?.toString().toUpperCase() === 'ALL DAY' || 
                           endTime?.toString().toUpperCase() === 'ALL DAY' ||
                           !startTime || !endTime;
            
            console.log(`📅 Found event: ${title} on ${convertedDate} ${isAllDay ? '(All Day)' : ''}`);
            
            const processedEvent = {
                title: title.toString().trim(),
                description: cleanHtmlContent(description.toString()),
                date: convertedDate,
                startTime: isAllDay ? '09:00:00' : convertTimeFormat(startTime), // Set All Day to 9AM
                endTime: isAllDay ? '17:00:00' : convertTimeFormat(endTime), // Set All Day to 5PM
                isAllDay: isAllDay,
                location: location?.toString().trim() || '',
                address: address?.toString().trim() || '',
                organizer: organizer?.toString().trim() || '',
                format: format?.toString().trim() || '',
                categories: parseCategories(categories?.toString() || ''),
                speakers: parseSpeakers(speakers?.toString() || '')
            };
            
            allEvents.push(processedEvent);
            
        } catch (error) {
            console.warn(`⚠️ Error processing row ${i + 1}:`, error.message);
            continue;
        }
    }
    
    console.log(`\n📊 Found ${allEvents.length} events to import\n`);
    
    if (allEvents.length === 0) {
        console.log('❌ No events found in the Excel file');
        return;
    }
    
    // Show date range of events
    const dates = allEvents.map(e => e.date).sort();
    console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    
    // Show sample of events by month
    const eventsByMonth = {};
    allEvents.forEach(event => {
        const month = event.date.substring(0, 7); // YYYY-MM
        if (!eventsByMonth[month]) {
            eventsByMonth[month] = [];
        }
        eventsByMonth[month].push(event.title);
    });
    
    console.log('\n📊 Events by month:');
    Object.keys(eventsByMonth).sort().forEach(month => {
        console.log(`  ${month}: ${eventsByMonth[month].length} events`);
    });
    
    // Now import each event
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Starting import process...\n');
    
    for (const event of allEvents) {
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
            
            // Show progress every 20 events
            if (successCount % 20 === 0) {
                console.log(`\n📊 Progress: ${successCount}/${allEvents.length} events imported...\n`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing event "${event.title}":`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n🎉 ALL EVENTS import completed!`);
    console.log(`✅ Successfully imported: ${successCount} events`);
    console.log(`❌ Failed to import: ${errorCount} events`);
    
    // Show summary by month
    console.log('\n📊 Final summary by month:');
    const { data: allImportedEvents } = await supabase
        .from('events')
        .select('title, date')
        .order('date', { ascending: true });
    
    if (allImportedEvents && allImportedEvents.length > 0) {
        const importedByMonth = {};
        allImportedEvents.forEach(event => {
            const month = event.date.substring(0, 7); // YYYY-MM
            if (!importedByMonth[month]) {
                importedByMonth[month] = 0;
            }
            importedByMonth[month]++;
        });
        
        Object.keys(importedByMonth).sort().forEach(month => {
            console.log(`  ${month}: ${importedByMonth[month]} events`);
        });
        
        console.log(`\n📅 Total events imported: ${allImportedEvents.length}`);
        console.log(`📅 Date range: ${allImportedEvents[0].date} to ${allImportedEvents[allImportedEvents.length - 1].date}`);
    }
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
    await clearAllData();
    await importAllEventsFromExcel();
}

// Run the complete process
main().catch(console.error);
