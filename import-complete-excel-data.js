const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to convert Excel date to ISO string
function convertExcelDateToISO(excelDate) {
  if (typeof excelDate === 'number') {
    // Excel date numbers (days since 1900-01-01)
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  } else if (typeof excelDate === 'string') {
    // Handle YYYY-MM-DD format
    const isoMatch = excelDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return excelDate;
    }
    // Handle DD/MM/YYYY format
    const ddmmMatch = excelDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmMatch) {
      const [, day, month, year] = ddmmMatch;
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

// Helper function to parse time
function parseTime(timeStr) {
  if (!timeStr || timeStr.toLowerCase() === 'all day') {
    return { startTime: '09:00:00', endTime: '17:00:00', isAllDay: true };
  }
  
  // Handle various time formats
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3]?.toLowerCase();
    
    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    const endTime = `${(hours + 2).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`; // Default 2-hour duration
    
    return { startTime, endTime, isAllDay: false };
  }
  
  return { startTime: '09:00:00', endTime: '17:00:00', isAllDay: true };
}

// Helper function to clean HTML content
function cleanHtmlContent(content) {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '').trim();
}

// Helper function to generate slug
function generateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Helper function to generate random color
function generateColor() {
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function importExcelData() {
  try {
    console.log('Starting Excel data import...');
    
    // Read Excel file
    const filePath = 'C:\\Users\\Varun Tyagi\\Downloads\\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.xlsx';
    
    if (!fs.existsSync(filePath)) {
      console.error('Excel file not found:', filePath);
      return;
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    
    if (data.length === 0) {
      console.log('No data found in Excel file');
      return;
    }
    
    // Log first row to understand structure
    console.log('Sample row structure:', Object.keys(data[0]));
    
    // Get admin user for author_id
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'drvarun1995@gmail.com')
      .limit(1);
    
    if (adminError || !adminUsers || adminUsers.length === 0) {
      console.error('Could not find admin user:', adminError);
      return;
    }
    
    const adminUserId = adminUsers[0].id;
    console.log('Using admin user:', adminUserId);
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await supabase.from('event_speakers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('speakers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organizers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('formats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Track created entities to avoid duplicates
    const categoriesMap = new Map();
    const formatsMap = new Map();
    const locationsMap = new Map();
    const organizersMap = new Map();
    const speakersMap = new Map();
    
    let importedEvents = 0;
    let importedCategories = 0;
    let importedFormats = 0;
    let importedLocations = 0;
    let importedOrganizers = 0;
    let importedSpeakers = 0;
    
    for (const row of data) {
      try {
        // Skip rows without essential data
        if (!row['Start Date'] || !row['Title']) {
          console.log('Skipping row without essential data:', row);
          continue;
        }
        
        // Parse date
        const date = convertExcelDateToISO(row['Start Date']);
        if (!date) {
          console.log('Skipping row with invalid date:', row['Start Date']);
          continue;
        }
        
        // Parse time
        const timeInfo = parseTime(row['Start Time']);
        
        // Create or get category
        let categoryId = null;
        if (row['Category']) {
          const categoryNames = row['Category'].split(',').map(name => name.trim()).filter(name => name);
          
          for (const categoryName of categoryNames) {
            if (!categoriesMap.has(categoryName)) {
              const { data: category, error: categoryError } = await supabase
                .from('categories')
                .insert({
                  name: categoryName,
                  slug: generateSlug(categoryName),
                  color: generateColor(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (categoryError) {
                console.error('Error creating category:', categoryError);
                continue;
              }
              
              categoriesMap.set(categoryName, category.id);
              importedCategories++;
              console.log('Created category:', categoryName);
            }
          }
          
          // Use the first category as the primary category
          categoryId = categoriesMap.get(categoryNames[0]);
        }
        
        // Create or get format
        let formatId = null;
        if (row['Format']) {
          const formatName = row['Format'].trim();
          if (!formatsMap.has(formatName)) {
            const { data: format, error: formatError } = await supabase
              .from('formats')
              .insert({
                name: formatName,
                slug: generateSlug(formatName),
                color: generateColor(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (formatError) {
              console.error('Error creating format:', formatError);
            } else {
              formatsMap.set(formatName, format.id);
              importedFormats++;
              console.log('Created format:', formatName);
            }
          }
          formatId = formatsMap.get(formatName);
        }
        
        // Create or get location (excluding address)
        let locationId = null;
        if (row['Location']) {
          const locationName = row['Location'].trim();
          if (!locationsMap.has(locationName)) {
            const { data: location, error: locationError } = await supabase
              .from('locations')
              .insert({
                name: locationName,
                address: null, // Exclude address as requested
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (locationError) {
              console.error('Error creating location:', locationError);
            } else {
              locationsMap.set(locationName, location.id);
              importedLocations++;
              console.log('Created location:', locationName);
            }
          }
          locationId = locationsMap.get(locationName);
        }
        
        // Create or get organizer
        let organizerId = null;
        if (row['Organizer']) {
          const organizerName = row['Organizer'].trim();
          if (!organizersMap.has(organizerName)) {
            const { data: organizer, error: organizerError } = await supabase
              .from('organizers')
              .insert({
                name: organizerName,
                email: null,
                phone: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (organizerError) {
              console.error('Error creating organizer:', organizerError);
            } else {
              organizersMap.set(organizerName, organizer.id);
              importedOrganizers++;
              console.log('Created organizer:', organizerName);
            }
          }
          organizerId = organizersMap.get(organizerName);
        }
        
        // Create event
        const eventData = {
          title: row['Title'].trim(),
          description: cleanHtmlContent(row['Description'] || ''),
          date: date,
          start_time: timeInfo.startTime,
          end_time: timeInfo.endTime,
          is_all_day: timeInfo.isAllDay,
          category_id: categoryId,
          format_id: formatId,
          location_id: locationId,
          organizer_id: organizerId,
          author_id: adminUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: event, error: eventError } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
        
        if (eventError) {
          console.error('Error creating event:', eventError);
          continue;
        }
        
        importedEvents++;
        console.log('Created event:', event.title);
        
        // Handle speakers if present
        if (row['Speaker']) {
          const speakerNames = row['Speaker'].split(',').map(name => name.trim()).filter(name => name);
          
          for (const speakerName of speakerNames) {
            let speakerId;
            
            if (!speakersMap.has(speakerName)) {
              const { data: speaker, error: speakerError } = await supabase
                .from('speakers')
                .insert({
                  name: speakerName,
                  bio: null,
                  email: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (speakerError) {
                console.error('Error creating speaker:', speakerError);
                continue;
              }
              
              speakersMap.set(speakerName, speaker.id);
              importedSpeakers++;
              console.log('Created speaker:', speakerName);
            }
            
            speakerId = speakersMap.get(speakerName);
            
            // Link speaker to event
            const { error: eventSpeakerError } = await supabase
              .from('event_speakers')
              .insert({
                event_id: event.id,
                speaker_id: speakerId,
                created_at: new Date().toISOString()
              });
            
            if (eventSpeakerError) {
              console.error('Error linking speaker to event:', eventSpeakerError);
            }
          }
        }
        
      } catch (error) {
        console.error('Error processing row:', error, row);
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Events imported: ${importedEvents}`);
    console.log(`Categories imported: ${importedCategories}`);
    console.log(`Formats imported: ${importedFormats}`);
    console.log(`Locations imported: ${importedLocations}`);
    console.log(`Organizers imported: ${importedOrganizers}`);
    console.log(`Speakers imported: ${importedSpeakers}`);
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importExcelData();
