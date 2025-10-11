import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Helper function to detect emails in text
function detectEmails(text: string): string[] {
  const emails = text.match(EMAIL_REGEX);
  return emails ? Array.from(new Set(emails)) : [];
}

// Helper function to remove emails from text
function removeEmails(text: string): string {
  return text.replace(EMAIL_REGEX, '[EMAIL REMOVED]');
}

// Removed fallback extraction - AI will handle everything

// Parse Excel file
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

    // Parse file based on type
    let fileContent = '';
    const fileName = file.name.toLowerCase();
    
    console.log('File name for parsing:', fileName);
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Detected Excel file, parsing...');
      fileContent = await parseExcelFile(buffer);
    } else if (fileName.endsWith('.pdf')) {
      console.log('Detected PDF file, parsing...');
      fileContent = await parsePDFFile(buffer);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log('Detected Word file, parsing...');
      fileContent = await parseWordFile(buffer);
    } else {
      console.log('Unsupported file type:', fileName);
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Detect emails in the content
    const detectedEmails = detectEmails(fileContent);
    console.log('📧 Email detection results:', {
      emailsFound: detectedEmails.length,
      emails: detectedEmails,
      autoDeleteEmails: autoDeleteEmails
    });
    
    // If emails found and not auto-deleting, return warning
    if (detectedEmails.length > 0 && !autoDeleteEmails) {
      console.log('⚠️ EARLY RETURN: Emails detected, returning warning to frontend');
      return NextResponse.json({
        emailsFound: detectedEmails,
        message: 'Email addresses detected in file'
      }, { status: 200 });
    }

    // Remove emails if auto-delete is enabled
    if (autoDeleteEmails) {
      console.log('🗑️ Auto-deleting emails from content...');
      fileContent = removeEmails(fileContent);
      console.log('✅ Emails removed, continuing with processing...');
    }

    // Debug: Log file content length
    console.log('File content length:', fileContent.length);
    console.log('File content preview:', fileContent.substring(0, 500));
    
    // Check if file content is empty or too short
    if (fileContent.length < 10) {
      console.log('ERROR: File content is too short or empty!');
      return NextResponse.json({ 
        error: 'File content appears to be empty or too short. Please check the file format.',
        debug: {
          fileContentLength: fileContent.length,
          fileContent: fileContent
        }
      }, { status: 400 });
    }

    // Fetch existing data from database with comprehensive event information
    console.log('🔍 FETCHING EXISTING DATA FROM DATABASE...');
    console.log('📋 ABOUT TO EXECUTE SUPABASE QUERIES...');
    const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes, eventsRes] = await Promise.all([
      supabaseAdmin.from('locations').select('id, name'),
      supabaseAdmin.from('speakers').select('id, name, role'),
      supabaseAdmin.from('categories').select('id, name, color'),
      supabaseAdmin.from('formats').select('id, name'),
      supabaseAdmin.from('organizers').select('id, name'),
      supabaseAdmin.from('events').select('id, title, description, date, start_time, end_time').order('date', { ascending: false }).limit(100)
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

    // Simple prompt without existing events (cost optimization)
    const prompt = `Extract events from this teaching schedule text. Look for rows with dates, times, and event names.

Return a JSON array like this:
[
  {
    "title": "Raw event name from Excel (e.g., 'Death Certificates, Other Forms & IV Fluids')",
    "date": "YYYY-MM-DD format",
    "startTime": "HH:MM format",
    "endTime": "HH:MM format"
  }
]

CRITICAL RULES:
1. Return ONLY the JSON array, no other text
2. If no events found, return: []
3. Do not wrap in markdown or code blocks
4. Start with [ and end with ]
5. TITLE RULES: Extract ONLY the raw event name from Excel. Do NOT add any format prefixes. Examples:
   - Excel shows "Death Certificates, Other Forms & IV Fluids" → Extract "Death Certificates, Other Forms & IV Fluids"
   - Excel shows "Gastroenterology" → Extract "Gastroenterology"
   - Excel shows "Induction talk" → Extract "Induction talk"
   NEVER add "Core Teaching:", "Twilight Teaching:", or any other format prefix.
6. DATE RULES: Read the EXACT dates from the text. Look for patterns like:
   - "08/09/2025" → "2025-09-08"
   - "15/12/2025" → "2025-12-15" 
   - "Thu 18-Sep-25" → "2025-09-18"
   - "Fri 19-Dec-25" → "2025-12-19"
   IMPORTANT: Use the EXACT year shown in the text. If you see "25", it means "2025". If you see "24", it means "2024".
7. TIME RULES: For times like "0.5416666666666666", convert to "13:00" (decimal = hours/24). For times like "14:00", use as-is.
8. DURATION RULES: If start time and end time are the same or very close (within 1 minute), set end time to 1 hour later.

Text to extract from:
${fileContent}`;

    // Debug: Log prompt length and preview
    console.log('AI Prompt length:', prompt.length);
    console.log('AI Prompt preview (first 1000 chars):', prompt.substring(0, 1000));
    
    // Debug: Look for date patterns in Excel content
    const excelDateMatches = fileContent.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w{3}\s+\d{1,2}[-]\w{3}[-]\d{2}/gi);
    if (excelDateMatches) {
      console.log('📅 Date patterns found in Excel content:', excelDateMatches.slice(0, 10));
    } else {
      console.log('⚠️ No date patterns found in Excel content');
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise event extraction assistant. You must extract ALL events from documents and return them as a JSON array. Always return valid JSON arrays, never objects. Be thorough and consistent.'
        },
        {
          role: 'user',
          content: prompt
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
    console.log('OpenAI response length:', responseContent.length);
    console.log('OpenAI response (first 500 chars):', responseContent.substring(0, 500));
    console.log('OpenAI response (full):', responseContent);
    
    // Look for date patterns in the response
    const dateMatches = responseContent.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches) {
      console.log('📅 Date patterns found in AI response:', dateMatches);
    } else {
      console.log('⚠️ No YYYY-MM-DD date patterns found in AI response');
    }
    
    // Check if response is empty or just whitespace
    if (!responseContent || responseContent.trim().length === 0) {
      console.log('🚨 AI returned empty or whitespace-only response!');
      return NextResponse.json({ 
        error: 'AI returned empty response. Please check the file content and try again.',
        debug: {
          fileContentLength: fileContent.length,
          fileContentPreview: fileContent.substring(0, 500),
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
            fileContentLength: fileContent.length,
            fileContentPreview: fileContent.substring(0, 500),
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

    // Add backend duplicate detection
    console.log('🔍 Starting duplicate detection...');
    console.log('📊 Total existing events to check against:', existingEvents.length);
    console.log('📊 Total extracted events to check:', events.length);
    
    // Debug: Show sample of existing events for comparison
    console.log('📋 Sample existing events (first 3):');
    existingEvents.slice(0, 3).forEach((event: any, index: number) => {
      console.log(`${index + 1}. "${event.title}" on ${event.date} at ${event.start_time}`);
    });
    
    // Debug: Show first few extracted events
    console.log('📋 First 3 extracted events:');
    events.slice(0, 3).forEach((event: any, index: number) => {
      console.log(`${index + 1}. "${event.title}"`);
      console.log(`   Date: "${event.date}" (raw value)`);
      console.log(`   Start Time: "${event.startTime}"`);
      console.log(`   End Time: "${event.endTime}"`);
      console.log(`   Location: "${event.location}"`);
      console.log('');
    });
    
    let eventsWithIds = events.map((event: any, index: number) => {
      // Check for duplicates against existing events
      let existingEventMatch = {
        isMatch: false,
        existingEventId: null,
        similarityReason: "No match found"
      };

      console.log(`\n🔍 Checking event ${index + 1}: "${event.title}" on ${event.date} at ${event.startTime}`);
      
      for (const existingEvent of existingEvents) {
        console.log(`  📋 Comparing with existing: "${existingEvent.title}" on ${existingEvent.date} at ${existingEvent.start_time}`);
        
        // Enhanced comparison with format prefix handling and time normalization
        const normalizeTitle = (title: string) => {
          // Remove format prefixes and normalize
          let normalized = title.toLowerCase()
            .replace(/^(core teaching|core teachings|twilight teaching|hub day|bedside teaching|osce revision|pharmacy teaching|grand round|inductions?|clinical skills?|portfolio drop-ins?|paeds practice sessions?|a-e practice sessions?|virtual reality sessions?|obs & gynae practice sessions?|exams & mocks?|others?):\s*/i, '')
            .replace(/\s*&\s*/g, ' and ')
            .replace(/\s+/g, ' ')
            .trim();
          return normalized;
        };
        
        const normalizeTime = (time: string) => {
          if (!time) return '';
          // Convert 24h to 12h format for comparison
          const time24 = time.replace(/\s*(am|pm)/i, '');
          const [hours, minutes] = time24.split(':').map(Number);
          if (hours === 0) return `12:${minutes.toString().padStart(2, '0')} AM`;
          if (hours < 12) return `${hours}:${minutes.toString().padStart(2, '0')} AM`;
          if (hours === 12) return `12:${minutes.toString().padStart(2, '0')} PM`;
          return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
        };
        
        const extractedTitle = normalizeTitle(event.title);
        const existingTitle = normalizeTitle(existingEvent.title);
        const extractedTime = normalizeTime(event.startTime);
        const existingTime = normalizeTime(existingEvent.start_time);
        
        console.log(`  🔍 Normalized title comparison: "${extractedTitle}" vs "${existingTitle}"`);
        console.log(`  🔍 Date comparison: "${event.date}" vs "${existingEvent.date}"`);
        console.log(`  🔍 Normalized time comparison: "${extractedTime}" vs "${existingTime}"`);
        
        // Exact match: same normalized title, date, and normalized time
        if (extractedTitle === existingTitle && 
            event.date === existingEvent.date && 
            extractedTime === existingTime) {
          console.log(`  ✅ EXACT MATCH found!`);
          existingEventMatch = {
            isMatch: true,
            existingEventId: existingEvent.id,
            similarityReason: "Exact match on normalized title, date, and time"
          };
          break;
        }
        
        // Likely match: same normalized title and date (different time)
        if (extractedTitle === existingTitle && 
            event.date === existingEvent.date) {
          console.log(`  ✅ TITLE+DATE MATCH found!`);
          console.log(`  📝 Match details: Title="${extractedTitle}", Date="${event.date}"`);
          existingEventMatch = {
            isMatch: true,
            existingEventId: existingEvent.id,
            similarityReason: "Match on normalized title and date (different time)"
          };
          break;
        }
        
        // Similar normalized title and same date and time
        if (extractedTitle.includes(existingTitle) || existingTitle.includes(extractedTitle)) {
          if (event.date === existingEvent.date && extractedTime === existingTime) {
            console.log(`  ✅ SIMILAR TITLE MATCH found!`);
            console.log(`  📝 Similar match details: "${extractedTitle}" contains "${existingTitle}" or vice versa`);
            existingEventMatch = {
              isMatch: true,
              existingEventId: existingEvent.id,
              similarityReason: "Similar normalized title with same date and time"
            };
            break;
          }
        }
      }

      console.log(`Event ${index + 1}:`, {
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        existingEventMatch: existingEventMatch
      });
      
      return {
      id: `temp-${Date.now()}-${index}`,
        ...event,
        existingEventMatch: existingEventMatch
      };
    });

    // Debug: Log extracted events and matching results
    console.log('Extracted events before deduplication:', eventsWithIds);
    console.log('Number of events extracted:', eventsWithIds.length);
    
    // Count matches
    const matchesFound = eventsWithIds.filter((event: any) => event.existingEventMatch?.isMatch).length;
    console.log(`🎯 DUPLICATE DETECTION SUMMARY: ${matchesFound} matches found out of ${eventsWithIds.length} events`);
    
    if (eventsWithIds.length === 0) {
      console.log('ERROR: No events extracted from file!');
      console.log('Raw parsed response:', parsedResponse);
      console.log('File content preview:', fileContent.substring(0, 1000));
      
      // Check if AI returned empty object
      if (typeof parsedResponse === 'object' && !Array.isArray(parsedResponse) && Object.keys(parsedResponse).length === 0) {
        console.log('AI returned empty object - this might be a prompt issue');
        return NextResponse.json({ 
          error: 'AI returned empty response. This might be due to unclear content format. Please check the file content and try again.',
          debug: {
            fileContentLength: fileContent.length,
            fileContentPreview: fileContent.substring(0, 500),
            parsedResponse: parsedResponse,
            aiIssue: 'AI returned empty object instead of array'
          }
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'No events were extracted from the file. Please check the file content and try again.',
        debug: {
          fileContentLength: fileContent.length,
          fileContentPreview: fileContent.substring(0, 500),
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
    eventsWithIds.forEach((event, index) => {
      console.log(`Event ${index + 1} existingEventMatch:`, event.existingEventMatch);
    });
    
    // Debug: Count duplicates found and matches found
    const duplicatesFound = validEvents.length - eventsWithIds.length;
    const existingMatchesFound = eventsWithIds.filter(e => e.existingEventMatch?.isMatch).length;
    const newEventsFound = eventsWithIds.length - existingMatchesFound;
    
    if (duplicatesFound > 0) {
      console.log(`Found and removed ${duplicatesFound} duplicate events`);
    }
    
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
      
      eventsWithIds = eventsWithIds.map((event: any) => ({
        ...event,
        locationId: bulkMainLocationId !== 'none' ? bulkMainLocationId : undefined,
        location: mainLocation?.name || undefined,
        otherLocationIds: otherLocationIds,
        otherLocations: otherLocations.map(l => ({ id: l.id, name: l.name }))
      }));
    }
    if (bulkMainOrganizerId || bulkOtherOrganizerIds) {
      const mainOrganizer = bulkMainOrganizerId ? existingOrganizers.find(o => o.id === bulkMainOrganizerId) : null;
      const otherOrganizerIds = bulkOtherOrganizerIds ? JSON.parse(bulkOtherOrganizerIds) : [];
      const otherOrganizers = existingOrganizers.filter(o => otherOrganizerIds.includes(o.id));
      
      eventsWithIds = eventsWithIds.map((event: any) => ({
        ...event,
        organizerId: bulkMainOrganizerId !== 'none' ? bulkMainOrganizerId : undefined,
        organizer: mainOrganizer?.name || undefined,
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
    eventsWithIds.forEach((event, index) => {
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

