import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced email regex patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const EMAIL_REGEX_STRICT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;

// Helper function to detect emails in text
function detectEmails(text: string): string[] {
  console.log('🔍 Detecting emails in text of length:', text.length);
  
  // Try both regex patterns
  const emails1 = text.match(EMAIL_REGEX) || [];
  const emails2 = text.match(EMAIL_REGEX_STRICT) || [];
  
  // Combine and deduplicate
  const allEmails = [...emails1, ...emails2];
  const uniqueEmails = Array.from(new Set(allEmails));
  
  console.log('🔍 Email detection details:', {
    strictPattern: emails1,
    loosePattern: emails2,
    combined: allEmails,
    unique: uniqueEmails
  });
  
  return uniqueEmails;
}

// Helper function to remove emails from text
function removeEmails(text: string): string {
  return text.replace(EMAIL_REGEX, '[EMAIL REMOVED]');
}

// Removed fallback extraction - AI will handle everything

// Parse Excel file with better structure preservation
async function parseExcelFileBetter(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing Excel file, buffer size:', buffer.length);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log('Excel workbook loaded, sheet names:', workbook.SheetNames);
    
    let allText = '';
    
    // Iterate through all sheets
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      console.log(`Processing sheet ${sheetIndex + 1}: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of the sheet
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      console.log(`Sheet range: ${worksheet['!ref']}`);
      
      // Convert to CSV format which preserves structure better
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      console.log(`Sheet ${sheetName} CSV length:`, csvData.length);
      
      // Add sheet header
      allText += `=== SHEET: ${sheetName} ===\n`;
      allText += csvData + '\n\n';
      
      // Log first few lines for debugging
      const lines = csvData.split('\n');
      console.log(`First 5 lines of ${sheetName}:`);
      lines.slice(0, 5).forEach((line, index) => {
        console.log(`  Line ${index + 1}: ${line}`);
      });
    });
    
    console.log('Excel parsing complete. Total text length:', allText.length);
    console.log('Excel content preview:', allText.substring(0, 1000));
    
    return allText;
  } catch (error) {
    console.error('Error parsing Excel:', error);
    throw new Error('Failed to parse Excel file');
  }
}

// Keep the old function for fallback
async function parseExcelFile(buffer: Buffer): Promise<string> {
  try {
    console.log('Parsing Excel file, buffer size:', buffer.length);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log('Excel workbook loaded, sheet names:', workbook.SheetNames);
    
    let allText = '';
    
    // Iterate through all sheets
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      console.log(`Processing sheet ${sheetIndex + 1}: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Sheet ${sheetName} has ${jsonData.length} rows`);
      
      // Convert to text
      jsonData.forEach((row: any, rowIndex) => {
        if (Array.isArray(row)) {
          const rowText = row.join(' | ');
          allText += rowText + '\n';
          
          // Log first few rows for debugging
          if (rowIndex < 5) {
            console.log(`Row ${rowIndex + 1}:`, rowText);
          }
        }
      });
    });
    
    console.log('Excel parsing complete. Total text length:', allText.length);
    console.log('Excel content preview:', allText.substring(0, 1000));
    
    // Look for date patterns in Excel content
    const datePatterns = allText.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (datePatterns) {
      console.log('📅 Date patterns found in Excel content:', datePatterns);
    }
    
    return allText;
  } catch (error) {
    console.error('Error parsing Excel:', error);
    throw new Error('Failed to parse Excel file');
  }
}

// Parse PDF file (basic text extraction - you may want to use a library like pdf-parse)
async function parsePDFFile(buffer: Buffer): Promise<string> {
  // For PDF parsing, you'd typically use a library like 'pdf-parse'
  // For now, return a placeholder that tells OpenAI to handle it
  return buffer.toString('utf-8');
}

// Parse Word file (basic extraction)
async function parseWordFile(buffer: Buffer): Promise<string> {
  // For Word parsing, you'd typically use a library like 'mammoth'
  // For now, return a basic text extraction
  return buffer.toString('utf-8');
}

export async function POST(request: NextRequest) {
  console.log('🚀 BULK UPLOAD PARSE API CALLED - STARTING PROCESS...');
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const autoDeleteEmails = formData.get('autoDeleteEmails') === 'true';
    
    // Parse bulk selections
    const bulkCategories = formData.get('bulkCategories') as string;
    const bulkFormatId = formData.get('bulkFormatId') as string;
    const bulkMainLocationId = formData.get('bulkMainLocationId') as string;
    const bulkOtherLocationIds = formData.get('bulkOtherLocationIds') as string;
    const bulkMainOrganizerId = formData.get('bulkMainOrganizerId') as string;
    const bulkOtherOrganizerIds = formData.get('bulkOtherOrganizerIds') as string;
    const bulkSpeakerIds = formData.get('bulkSpeakerIds') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('File buffer created, size:', buffer.length);

    // Check file type first
    const fileName = file.name.toLowerCase();
    
    console.log('File name:', fileName);
    console.log('File size:', buffer.length, 'bytes');
    
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      console.log('Unsupported file type:', fileName);
      return NextResponse.json({ 
        error: 'Only Excel files (.xlsx, .xls) are supported. Please upload an Excel file.' 
      }, { status: 400 });
    }

    // Check file size first (limit to 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxFileSize) {
      console.log('❌ File too large:', buffer.length, 'bytes (max:', maxFileSize, 'bytes)');
      return NextResponse.json({
        error: `File is too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum file size is 10MB.`,
        fileSize: buffer.length,
        maxSize: maxFileSize
      }, { status: 413 });
    }

    // Check for emails by parsing the Excel file first
    console.log('📧 Checking for emails in Excel file...');
    
    // Parse Excel file to get CSV content for email checking
    const fileTextForEmailCheck = await parseExcelFileBetter(buffer);
    
    const detectedEmails = detectEmails(fileTextForEmailCheck);
    
    console.log('📧 Email detection results:', {
      emailsFound: detectedEmails.length,
      emails: detectedEmails,
      fileSize: buffer.length,
      parsedTextLength: fileTextForEmailCheck.length
    });
    
    // Debug: Show a sample of the parsed text to see what we're checking
    console.log('📧 Parsed file text sample (first 1000 chars):', fileTextForEmailCheck.substring(0, 1000));
    
    // If emails found, return error asking user to remove them
    if (detectedEmails.length > 0) {
      console.log('❌ EMAILS DETECTED: File contains email addresses');
      return NextResponse.json({
        error: `File contains email addresses: ${detectedEmails.join(', ')}. Please remove all email addresses before uploading.`,
        emails: detectedEmails
      }, { status: 400 });
    }

    console.log('✅ No emails detected, proceeding with file processing');

    // Fetch existing data from database with comprehensive event information
    console.log('🔍 FETCHING EXISTING DATA FROM DATABASE...');
    console.log('📋 ABOUT TO EXECUTE SUPABASE QUERIES...');
    const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes, eventsRes] = await Promise.all([
      supabaseAdmin.from('locations').select('id, name'),
      supabaseAdmin.from('speakers').select('id, name, role'),
      supabaseAdmin.from('categories').select('id, name, color'),
      supabaseAdmin.from('formats').select('id, name'),
      supabaseAdmin.from('organizers').select('id, name'),
      supabaseAdmin.from('events').select('id, title, description, date, start_time, end_time').order('date', { ascending: false }).limit(500)
    ]);
    
    console.log('✅ SUPABASE QUERIES COMPLETED SUCCESSFULLY!');
    console.log('📊 SUPABASE QUERY RESULTS:');
    console.log('Locations:', locationsRes);
    console.log('Speakers:', speakersRes);
    console.log('Categories:', categoriesRes);
    console.log('Formats:', formatsRes);
    console.log('Organizers:', organizersRes);
    console.log('Events:', eventsRes);

    const existingLocations = locationsRes.data || [];
    const existingSpeakers = speakersRes.data || [];
    const existingCategories = categoriesRes.data || [];
    const existingFormats = formatsRes.data || [];
    const existingOrganizers = organizersRes.data || [];
    const existingEvents = eventsRes.data || [];
    
    // Debug: Log existing events structure
    console.log('🔍 EXISTING EVENTS DEBUG:');
    console.log('Existing events count:', existingEvents.length);
    console.log('Raw existing events data:', existingEvents);
    
    if (existingEvents.length > 0) {
      console.log('Sample existing event structure:', {
        id: existingEvents[0].id,
        title: existingEvents[0].title,
        date: existingEvents[0].date,
        start_time: existingEvents[0].start_time
      });
      
      // Log first few existing events for debugging
      console.log('First 3 existing events:');
      existingEvents.slice(0, 3).forEach((event: any, index: number) => {
        console.log(`${index + 1}. "${event.title}" - ${event.date} at ${event.start_time}`);
      });
    } else {
      console.log('⚠️ NO EXISTING EVENTS FOUND IN DATABASE!');
      console.log('This might be why duplicate detection is not working.');
      console.log('Events query response:', eventsRes);
    }

    const prompt = `Extract teaching events from the attached file. Return a JSON array like this:

[
  {
    "title": "Event name",
    "date": "2025-10-03",
    "startTime": "13:00",
    "endTime": "14:00"
  }
]

Rules:
1. Extract event titles (remove format prefixes like "Core Teaching:", "Twilight Teaching:")
2. Convert dates to YYYY-MM-DD format
3. Convert decimal times (like 0.5416667) to HH:MM format (multiply by 24)
4. If no end time, set end time to 1 hour after start time
5. Return only the JSON array, no other text`;

    // Debug: Log prompt length and preview
    console.log('AI Prompt length:', prompt.length);
    console.log('AI Prompt preview (first 1000 chars):', prompt.substring(0, 1000));
    
    console.log('📅 File processing - date patterns will be checked after AI response');

    // Use the already parsed text for OpenAI
    console.log('📄 Using parsed text for OpenAI...');
    const textContent = fileTextForEmailCheck;
    
    console.log('📄 Text content length:', textContent.length);
    console.log('📄 Text preview:', textContent.substring(0, 500));
    
    // Call OpenAI API with text content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract teaching events from the provided document text. Return a JSON array with title, date, startTime, endTime. Be accurate with dates and times.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${textContent}`
        }
      ],
      temperature: 0.05 // Very low temperature for maximum consistency
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('No response content from OpenAI');
      console.error('Completion object:', completion);
      throw new Error('No response from OpenAI');
    }

    // Debug: Log AI response
    console.log('🤖 OpenAI response length:', responseContent.length);
    console.log('🤖 OpenAI response (first 500 chars):', responseContent.substring(0, 500));
    console.log('🤖 OpenAI response (full):', responseContent);
    console.log('🤖 Response type:', typeof responseContent);
    console.log('🤖 Response is empty?', !responseContent || responseContent.trim().length === 0);
    
    // Look for date patterns in the response
    const dateMatches = responseContent.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches) {
      console.log('📅 Date patterns found in AI response:', dateMatches);
      
      // Check what years the AI extracted
      const year2025Extracted = dateMatches.filter(date => date.includes('2025'));
      const year2023Extracted = dateMatches.filter(date => date.includes('2023'));
      console.log('📅 AI extracted 2025 dates:', year2025Extracted);
      console.log('📅 AI extracted 2023 dates:', year2023Extracted);
    } else {
      console.log('⚠️ No YYYY-MM-DD date patterns found in AI response');
    }
    
    // Check if response is empty or just whitespace
    if (!responseContent || responseContent.trim().length === 0) {
      console.log('🚨 AI returned empty or whitespace-only response!');
      return NextResponse.json({ 
        error: 'AI returned empty response. Please check the file content and try again.',
        debug: {
          aiResponse: responseContent,
          issue: 'AI returned empty response'
        }
      }, { status: 400 });
    }

    // Parse the JSON response with robust handling
    let parsedResponse;
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = responseContent.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned response for parsing:', cleanResponse.substring(0, 500));
      
      parsedResponse = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseContent);
      console.error('Parse error:', e);
      
      // Try to extract JSON from the response if it's wrapped in text
      try {
        const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          console.log('Found JSON array in response, extracting...');
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (e2) {
        console.error('Failed to extract JSON from response');
        return NextResponse.json({ 
          error: 'AI returned invalid JSON response. Please try again.',
          debug: {
            aiResponse: responseContent,
            parseError: e instanceof Error ? e.message : String(e)
          }
        }, { status: 400 });
      }
    }

    // Extract events array from response
    let events = [];
    
    console.log('Parsed response type:', typeof parsedResponse);
    console.log('Is parsed response array?', Array.isArray(parsedResponse));
    
    if (Array.isArray(parsedResponse)) {
      events = parsedResponse;
      console.log('Using direct array from response');
    } else if (parsedResponse.events && Array.isArray(parsedResponse.events)) {
      events = parsedResponse.events;
      console.log('Using events array from response');
    } else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      events = parsedResponse.data;
      console.log('Using data array from response');
    } else {
      // If response is an object with various keys, try to find an array
      const arrayKeys = Object.keys(parsedResponse).filter(key => 
        Array.isArray(parsedResponse[key])
      );
      if (arrayKeys.length > 0) {
        events = parsedResponse[arrayKeys[0]];
        console.log('Using array from key:', arrayKeys[0]);
      } else {
        console.log('🚨 AI returned object instead of array');
        console.log('🚨 Response keys:', Object.keys(parsedResponse));
        console.log('🚨 Full response:', parsedResponse);
        events = [];
      }
    }

    // Debug: Show what AI extracted before adding format prefix
    console.log('📋 AI extracted titles (BEFORE adding format prefix):');
    events.slice(0, 3).forEach((event: any, index: number) => {
      console.log(`${index + 1}. "${event.title}"`);
    });

    // Add format prefix if user selected a bulk format
    if (bulkFormatId) {
      const format = existingFormats.find(f => f.id === bulkFormatId);
      if (format) {
        console.log(`📝 Adding format prefix "${format.name}:" to extracted titles`);
        events = events.map((event: any) => ({
          ...event,
          title: `${format.name}: ${event.title}`
        }));
        
        // Debug: Show titles after adding format prefix
        console.log('📋 Titles AFTER adding format prefix:');
        events.slice(0, 3).forEach((event: any, index: number) => {
          console.log(`${index + 1}. "${event.title}"`);
        });
      }
    } else {
      console.log(`📝 No bulk format selected - keeping titles as extracted`);
    }

    // Fix times from Excel (but let AI handle dates correctly)
    events = events.map((event: any) => {

      const fixTime = (time: string) => {
        if (!time) return time;
        // Check if it's a decimal number (Excel time format)
        const decimalMatch = time.match(/^0\.\d+$/);
        if (decimalMatch) {
          const decimal = parseFloat(time);
          const hours = Math.floor(decimal * 24);
          const minutes = Math.round((decimal * 24 - hours) * 60);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return time;
      };

      const startTime = fixTime(event.startTime);
      const endTime = fixTime(event.endTime);

      // If start and end times are too close, set end time to 1 hour later
      if (startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (endMinutes - startMinutes < 60) { // Less than 1 hour
          const newEndMinutes = startMinutes + 60;
          const newEndHour = Math.floor(newEndMinutes / 60) % 24;
          const newEndMin = newEndMinutes % 60;
          event.endTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;
          console.log(`🕐 Fixed short duration: ${startTime}-${endTime} → ${startTime}-${event.endTime}`);
        }
      }

      return {
        ...event,
        startTime: startTime,
        endTime: endTime
      };
    });

    // Simple processing - no duplicate detection for now
    console.log('📊 Total extracted events:', events.length);
    console.log('📋 First 3 extracted events:');
    events.slice(0, 3).forEach((event: any, index: number) => {
      console.log(`${index + 1}. "${event.title}"`);
      console.log(`   Date: "${event.date}"`);
      console.log(`   Start Time: "${event.startTime}"`);
      console.log(`   End Time: "${event.endTime}"`);
      console.log('');
    });
    
    // Perform duplication check against existing events
    console.log('🔍 PERFORMING DUPLICATION CHECK...');
    
    // Filter existing events by selected format if bulk format is selected
    let eventsToCheckAgainst = existingEvents;
    if (bulkFormatId) {
      const selectedFormat = existingFormats.find(f => f.id === bulkFormatId);
      if (selectedFormat) {
        console.log(`📋 Filtering existing events to only check against "${selectedFormat.name}" format events`);
        eventsToCheckAgainst = existingEvents.filter((existingEvent: any) => {
          // Check if existing event title starts with the selected format name
          const titleStartsWithFormat = existingEvent.title && 
            existingEvent.title.toLowerCase().startsWith(selectedFormat.name.toLowerCase() + ':');
          console.log(`   Event "${existingEvent.title}" starts with format "${selectedFormat.name}": ${titleStartsWithFormat}`);
          return titleStartsWithFormat;
        });
        console.log(`📊 Filtered to ${eventsToCheckAgainst.length} events matching format "${selectedFormat.name}" out of ${existingEvents.length} total events`);
      }
    }
    
    console.log(`Checking ${events.length} extracted events against ${eventsToCheckAgainst.length} existing events (filtered by format)`);
    
    let eventsWithIds = events.map((event: any, index: number) => {
      // Simple duplication check: exact title and date match
      const duplicate = eventsToCheckAgainst.find((existingEvent: any) => {
        if (!existingEvent.title || !event.title) return false;
        
        // Enhanced title normalization for better matching
        const normalizeTitle = (title: string) => {
          return title.toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\s*:\s*/g, ': ') // Normalize spacing around colons
            .replace(/\s*\/\s*/g, ' / ') // Normalize spacing around slashes
            .replace(/\s*&\s*/g, ' and ') // Replace & with 'and'
            .replace(/\s*\+\s*/g, ' and ') // Replace + with 'and'
            .replace(/[^\w\s:/-]/g, '') // Remove special characters except :, /, -
            .replace(/\s+/g, ' ') // Clean up any extra spaces
            .trim();
        };
        
        const titleMatch = normalizeTitle(existingEvent.title) === normalizeTitle(event.title);
        
        // Exact date match
        const dateMatch = existingEvent.date === event.date;
        
        // Log each comparison for debugging
        console.log(`🔍 Checking: "${event.title}" (${event.date}) vs "${existingEvent.title}" (${existingEvent.date})`);
        console.log(`   Normalized extracted: "${normalizeTitle(event.title)}"`);
        console.log(`   Normalized existing: "${normalizeTitle(existingEvent.title)}"`);
        console.log(`   Title match: ${titleMatch} (normalized)`);
        console.log(`   Date match: ${dateMatch}`);
        console.log(`   Both match: ${titleMatch && dateMatch}`);
        
        // Extra debugging for potential matches
        if (event.title.toLowerCase().includes('induction') && existingEvent.title.toLowerCase().includes('induction')) {
          console.log(`   🚨 INDUCTION DEBUG:`);
          console.log(`   Raw extracted: "${event.title}"`);
          console.log(`   Raw existing: "${existingEvent.title}"`);
          console.log(`   Extracted length: ${event.title.length}`);
          console.log(`   Existing length: ${existingEvent.title.length}`);
          console.log(`   Character codes extracted:`, Array.from(event.title).map(c => c.charCodeAt(0)));
          console.log(`   Character codes existing:`, Array.from(existingEvent.title).map(c => c.charCodeAt(0)));
        }
        
        return titleMatch && dateMatch;
      });
      
      if (duplicate) {
        console.log(`✅ DUPLICATE FOUND: "${event.title}" on ${event.date} matches existing event ID ${duplicate.id}`);
        return {
          id: `temp-${Date.now()}-${index}`,
          ...event,
          existingEventMatch: {
            isMatch: true,
            existingEventId: duplicate.id,
            similarityReason: `Exact match on title and date - "${duplicate.title}" (ID: ${duplicate.id})`
          }
        };
      } else {
        console.log(`🆕 NEW EVENT: "${event.title}" on ${event.date} - no exact matches found`);
        return {
          id: `temp-${Date.now()}-${index}`,
          ...event,
          existingEventMatch: {
            isMatch: false,
            existingEventId: null,
            similarityReason: "New event - no exact matches found"
          }
        };
      }
    });

    // Count duplicates and new events
    const duplicatesFound = eventsWithIds.filter((e: any) => e.existingEventMatch?.isMatch).length;
    const newEventsFound = eventsWithIds.length - duplicatesFound;
    
    console.log(`📊 DUPLICATION CHECK RESULTS:`);
    console.log(`   Total events extracted: ${eventsWithIds.length}`);
    console.log(`   New events: ${newEventsFound}`);
    console.log(`   Existing duplicates (within selected format): ${duplicatesFound}`);
    if (bulkFormatId) {
      const selectedFormat = existingFormats.find(f => f.id === bulkFormatId);
      console.log(`   Format filtered to: "${selectedFormat?.name}" only`);
    }

    console.log('Number of events extracted:', eventsWithIds.length);
    
    if (eventsWithIds.length === 0) {
      console.log('ERROR: No events extracted from file!');
      console.log('Raw parsed response:', parsedResponse);
      
      // Check if AI returned empty object
      if (typeof parsedResponse === 'object' && !Array.isArray(parsedResponse) && Object.keys(parsedResponse).length === 0) {
        console.log('AI returned empty object - this might be a prompt issue');
        return NextResponse.json({ 
          error: 'AI returned empty response. This might be due to unclear content format. Please check the file content and try again.',
          debug: {
            parsedResponse: parsedResponse,
            aiIssue: 'AI returned empty object instead of array'
          }
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'No events were extracted from the file. Please check the file content and try again.',
        debug: {
          parsedResponse: parsedResponse
        }
      }, { status: 400 });
    }
    
    console.log('Sample extracted event structure:', eventsWithIds[0] ? {
      title: eventsWithIds[0].title,
      date: eventsWithIds[0].date,
      startTime: eventsWithIds[0].startTime,
      format: eventsWithIds[0].format,
      formatId: eventsWithIds[0].formatId
    } : 'No events extracted');

    // Filter out events missing required fields
    const validEvents = eventsWithIds.filter((event: any) => {
      if (!event.title || !event.date || !event.startTime) {
        console.log('Skipping incomplete event (missing required fields):', {
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          format: event.format
        });
        return false;
      }
      
      // Log format extraction for debugging
      if (!event.format) {
        console.log('Event missing format (but still valid):', {
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          format: event.format || 'NO FORMAT EXTRACTED'
        });
      }
      
      return true;
    });

    // Use validEvents (which has existingEventMatch) as the final result
    eventsWithIds = validEvents;
    console.log('Valid events after filtering:', validEvents.length);
    console.log('Final events with existingEventMatch:', eventsWithIds.length);

    // Keep the existingEventMatch from the first matching process

    console.log('Events with enhanced matching:', eventsWithIds);
    
    // Debug: Verify existingEventMatch property is preserved
    console.log('🔍 Verifying existingEventMatch property...');
    eventsWithIds.forEach((event: any, index: number) => {
      console.log(`Event ${index + 1} existingEventMatch:`, event.existingEventMatch);
    });
    
    // Debug: Count duplicates found and matches found
    const existingMatchesFound = eventsWithIds.filter((e: any) => e.existingEventMatch?.isMatch).length;
    
    console.log(`Final results: ${newEventsFound} new events, ${existingMatchesFound} existing matches`);
    
    if (existingMatchesFound === 0 && existingEvents.length > 0) {
      console.log('WARNING: No existing matches found despite having existing events in database!');
      console.log('This suggests the matching logic needs adjustment.');
    }

    // Apply bulk selections to all events
    if (bulkCategories) {
      const categoryIds = JSON.parse(bulkCategories);
      const categories = existingCategories.filter(c => categoryIds.includes(c.id));
      if (categories.length > 0) {
        eventsWithIds = eventsWithIds.map((event: any) => ({
          ...event,
          categoryIds: categoryIds,
          categories: categories.map(c => ({ id: c.id, name: c.name, color: c.color }))
        }));
      }
    }
    if (bulkFormatId) {
      const format = existingFormats.find(f => f.id === bulkFormatId);
      if (format) {
        eventsWithIds = eventsWithIds.map((event: any) => ({
          ...event,
          formatId: bulkFormatId,
          format: format.name
          // Note: Format prefix NOT added - Excel file already contains formatted titles
        }));
      }
    }
    if (bulkMainLocationId || bulkOtherLocationIds) {
      const mainLocation = bulkMainLocationId ? existingLocations.find(l => l.id === bulkMainLocationId) : null;
      const otherLocationIds = bulkOtherLocationIds ? JSON.parse(bulkOtherLocationIds) : [];
      const otherLocations = existingLocations.filter(l => otherLocationIds.includes(l.id));
      
      // Combine main location and other locations into a single array
      const allLocationIds = [];
      if (bulkMainLocationId && bulkMainLocationId !== 'none') {
        allLocationIds.push(bulkMainLocationId);
      }
      allLocationIds.push(...otherLocationIds);
      
      eventsWithIds = eventsWithIds.map((event: any) => ({
        ...event,
        locationId: bulkMainLocationId !== 'none' ? bulkMainLocationId : undefined,
        location: mainLocation?.name || undefined,
        locationIds: allLocationIds, // Combined array for junction table
        otherLocationIds: otherLocationIds,
        otherLocations: otherLocations.map(l => ({ id: l.id, name: l.name }))
      }));
    }
    if (bulkMainOrganizerId || bulkOtherOrganizerIds) {
      const mainOrganizer = bulkMainOrganizerId ? existingOrganizers.find(o => o.id === bulkMainOrganizerId) : null;
      const otherOrganizerIds = bulkOtherOrganizerIds ? JSON.parse(bulkOtherOrganizerIds) : [];
      const otherOrganizers = existingOrganizers.filter(o => otherOrganizerIds.includes(o.id));
      
      // Combine main organizer and other organizers into a single array
      const allOrganizerIds = [];
      if (bulkMainOrganizerId && bulkMainOrganizerId !== 'none') {
        allOrganizerIds.push(bulkMainOrganizerId);
      }
      allOrganizerIds.push(...otherOrganizerIds);
      
      eventsWithIds = eventsWithIds.map((event: any) => ({
        ...event,
        organizerId: bulkMainOrganizerId !== 'none' ? bulkMainOrganizerId : undefined,
        organizer: mainOrganizer?.name || undefined,
        organizerIds: allOrganizerIds, // Combined array for junction table
        otherOrganizerIds: otherOrganizerIds,
        otherOrganizers: otherOrganizers.map(o => ({ id: o.id, name: o.name }))
      }));
    }
    if (bulkSpeakerIds) {
      const speakerIds = JSON.parse(bulkSpeakerIds);
      const speakers = existingSpeakers.filter(s => speakerIds.includes(s.id));
      if (speakers.length > 0) {
        eventsWithIds = eventsWithIds.map((event: any) => ({
          ...event,
          speakerIds: speakerIds,
          speakers: speakers.map(s => ({ id: s.id, name: s.name, role: s.role }))
        }));
      }
    }

    // Final verification that existingEventMatch is preserved
    console.log('🔍 Final backend verification - existingEventMatch property:');
    eventsWithIds.forEach((event: any, index: number) => {
      console.log(`Final Event ${index + 1}:`, {
        title: event.title,
        existingEventMatch: event.existingEventMatch,
        hasExistingMatch: !!event.existingEventMatch?.isMatch
      });
    });

    return NextResponse.json({
      events: eventsWithIds,
      message: `Successfully extracted ${eventsWithIds.length} events`
    });

  } catch (error: any) {
    console.error('Bulk upload parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}

