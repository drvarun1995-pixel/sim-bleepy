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

// Parse Excel file
async function parseExcelFile(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let allText = '';
    
    // Iterate through all sheets
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to text
      jsonData.forEach((row: any) => {
        if (Array.isArray(row)) {
          allText += row.join(' | ') + '\n';
        }
      });
    });
    
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse file based on type
    let fileContent = '';
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      fileContent = await parseExcelFile(buffer);
    } else if (fileName.endsWith('.pdf')) {
      fileContent = await parsePDFFile(buffer);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      fileContent = await parseWordFile(buffer);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Detect emails in the content
    const detectedEmails = detectEmails(fileContent);
    
    // If emails found and not auto-deleting, return warning
    if (detectedEmails.length > 0 && !autoDeleteEmails) {
      return NextResponse.json({
        emailsFound: detectedEmails,
        message: 'Email addresses detected in file'
      }, { status: 200 });
    }

    // Remove emails if auto-delete is enabled
    if (autoDeleteEmails) {
      fileContent = removeEmails(fileContent);
    }

    // Debug: Log file content length
    console.log('File content length:', fileContent.length);
    console.log('File content preview:', fileContent.substring(0, 500));

    // Fetch existing data from database with comprehensive event information
    const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes, eventsRes] = await Promise.all([
      supabaseAdmin.from('locations').select('id, name'),
      supabaseAdmin.from('speakers').select('id, name, role'),
      supabaseAdmin.from('categories').select('id, name, color'),
      supabaseAdmin.from('formats').select('id, name'),
      supabaseAdmin.from('organizers').select('id, name'),
      supabaseAdmin.from('events').select(`
        id, title, description, date, start_time, end_time,
        locations!inner(id, name),
        formats!inner(id, name),
        categories!inner(id, name, color),
        organizers!inner(id, name),
        event_speakers(speakers!inner(id, name, role))
      `).order('date', { ascending: false }).limit(100)
    ]);

    const existingLocations = locationsRes.data || [];
    const existingSpeakers = speakersRes.data || [];
    const existingCategories = categoriesRes.data || [];
    const existingFormats = formatsRes.data || [];
    const existingOrganizers = organizersRes.data || [];
    const existingEvents = eventsRes.data || [];
    
    // Debug: Log existing events structure
    console.log('Existing events count:', existingEvents.length);
    if (existingEvents.length > 0) {
      console.log('Sample existing event structure:', {
        title: existingEvents[0].title,
        date: existingEvents[0].date,
        start_time: existingEvents[0].start_time,
        formats: existingEvents[0].formats,
        formatName: Array.isArray(existingEvents[0].formats) ? existingEvents[0].formats[0]?.name : existingEvents[0].formats?.name
      });
    }

    // Create prompt for OpenAI with comprehensive existing event data
    const prompt = `You are an AI assistant that extracts event information from documents and intelligently matches them against existing events in the database.

CRITICAL REQUIREMENTS:
1. Extract ALL events from the document (do not skip any)
2. Each event must have: title, date, and start time
3. Be CONSISTENT - extract the same events every time from the same document
4. Do NOT create duplicate entries for the same event (same title + date + time + format)
5. Format is a crucial distinguishing factor - events with same title/date/time but different formats are DIFFERENT events
6. Compare each extracted event against the existing events list below

STEP 1: EXTRACT ALL EVENTS
Extract the following information for each event found:
- Event title (required)
- Event date in YYYY-MM-DD format (required)  
- Start time in HH:MM 24-hour format (required)
- End time in HH:MM 24-hour format (optional)
- Event format (CRITICAL - required for duplicate detection)

STEP 2: MATCH AGAINST EXISTING EVENTS
For each extracted event, check if it matches any existing event in the database below.
Consider a match if:
- Same or very similar title AND same date
- Same title AND same start time
- Same date AND same start time AND similar title

STEP 3: MATCH EXISTING DATA
Match locations, speakers, categories, formats, and organizers with existing data:

CRITICAL FORMAT MATCHING:
- ALWAYS extract the format for each event
- Match the format with the existing formats list below
- If no clear format is mentioned, use "No format" or leave format empty
- Format is ESSENTIAL for duplicate detection

EXISTING LOCATIONS:
${existingLocations.map(l => `   - ${l.name} (ID: ${l.id})`).join('\n')}

EXISTING SPEAKERS:
${existingSpeakers.map(s => `   - ${s.name}, ${s.role} (ID: ${s.id})`).join('\n')}

EXISTING CATEGORIES:
${existingCategories.map(c => `   - ${c.name} (ID: ${c.id})`).join('\n')}

EXISTING FORMATS:
${existingFormats.map(f => `   - ${f.name} (ID: ${f.id})`).join('\n')}

EXISTING ORGANIZERS:
${existingOrganizers.map(o => `   - ${o.name} (ID: ${o.id})`).join('\n')}

IMPORTANT RULES:
- Extract ALL events from the document (don't skip any)
- Be consistent with extraction results
- Do NOT create duplicate entries for the same event
- If the same event appears multiple times in the document, extract it only ONCE
- Only match existing locations, speakers, categories, formats, organizers
- Convert all times to 24-hour format (HH:MM)
- If date/time is unclear, use your best judgment

EXISTING EVENTS IN DATABASE - COMPARE YOUR EXTRACTED EVENTS AGAINST THESE:
${existingEvents.map((event: any, index: number) => {
  const speakers = event.event_speakers?.map((es: any) => es.speakers?.name).filter(Boolean).join(', ') || 'None';
  const location = Array.isArray(event.locations) ? event.locations[0]?.name : (event.locations as any)?.name;
  const format = Array.isArray(event.formats) ? event.formats[0]?.name : (event.formats as any)?.name;
  const category = Array.isArray(event.categories) ? event.categories[0]?.name : (event.categories as any)?.name;
  const organizer = Array.isArray(event.organizers) ? event.organizers[0]?.name : (event.organizers as any)?.name;
  
  return `EXISTING EVENT ${index + 1}:
   Title: "${event.title}"
   Date: ${event.date}
   Start Time: ${event.start_time}
   End Time: ${event.end_time || 'None'}
   Location: ${location || 'None'}
   Format: ${format || 'None'}
   Category: ${category || 'None'}
   Organizer: ${organizer || 'None'}
   Speakers: ${speakers}
   ---`;
}).join('\n')}

IMPORTANT: For each event you extract, check if it matches any of the above existing events. If it matches, set existingEventMatch.isMatch = true and provide the existingEventId and similarityReason.

Return the events as a JSON array with the following structure:
[
  {
    "title": "Event Title",
    "description": "Brief description if available",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "locationId": "uuid-if-matched",
    "location": "location name if matched",
    "categoryId": "uuid-if-matched",
    "category": "category name if matched",
    "formatId": "uuid-if-matched",
    "format": "format name if matched",
    "organizerId": "uuid-if-matched",
    "organizer": "organizer name if matched",
    "speakerIds": ["uuid1", "uuid2"],
    "speakers": ["speaker name 1", "speaker name 2"],
    "existingEventMatch": {
      "isMatch": false,
      "existingEventId": "uuid-if-similar-event-found",
      "similarityReason": "reason for similarity if match found"
    }
  }
]

If no events are found, return an empty array [].

Document content:
${fileContent}

Extract all events and return them as a JSON array:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise event extraction assistant. You must extract ALL events from documents consistently and match them against existing events in the database. Always return valid JSON. Be thorough and consistent - extract the same events every time from the same document.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.05, // Very low temperature for maximum consistency
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Debug: Log AI response
    console.log('OpenAI response:', responseContent);

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Extract events array from response
    let events = [];
    if (Array.isArray(parsedResponse)) {
      events = parsedResponse;
    } else if (parsedResponse.events && Array.isArray(parsedResponse.events)) {
      events = parsedResponse.events;
    } else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      events = parsedResponse.data;
    } else {
      // If response is an object with various keys, try to find an array
      const arrayKeys = Object.keys(parsedResponse).filter(key => 
        Array.isArray(parsedResponse[key])
      );
      if (arrayKeys.length > 0) {
        events = parsedResponse[arrayKeys[0]];
      }
    }

    // Add unique IDs to events for tracking
    let eventsWithIds = events.map((event: any, index: number) => ({
      id: `temp-${Date.now()}-${index}`,
      ...event
    }));

    // Debug: Log extracted events
    console.log('Extracted events before deduplication:', eventsWithIds);
    console.log('Sample extracted event structure:', eventsWithIds[0] ? {
      title: eventsWithIds[0].title,
      date: eventsWithIds[0].date,
      startTime: eventsWithIds[0].startTime,
      format: eventsWithIds[0].format,
      formatId: eventsWithIds[0].formatId
    } : 'No events extracted');

    // Filter out events missing required fields
    const validEvents = eventsWithIds.filter(event => {
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

    // Deduplicate events based on title + date + start time + format
    const uniqueEvents = [];
    const seenEvents = new Set();
    
    for (const event of validEvents) {
      const formatPart = event.format ? `|${event.format}` : '|no-format';
      const eventKey = `${event.title.toLowerCase().trim()}|${event.date}|${event.startTime}${formatPart}`;
      console.log(`Processing event key: "${eventKey}"`);
      if (!seenEvents.has(eventKey)) {
        seenEvents.add(eventKey);
        uniqueEvents.push(event);
        console.log(`Added unique event: "${event.title}" (${event.format || 'no format'})`);
      } else {
        console.log('Skipping duplicate extracted event:', {
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          format: event.format || 'no format'
        });
      }
    }

    eventsWithIds = uniqueEvents;
    console.log('Valid events after filtering:', validEvents.length);
    console.log('Unique events after deduplication:', eventsWithIds.length);

    // Enhanced existing event matching on backend
    eventsWithIds = eventsWithIds.map(event => {
      // Check if this event matches any existing event (more flexible matching including format)
      const matchingEvent = existingEvents.find((existing: any) => {
        const titleMatch = existing.title.toLowerCase().trim() === event.title.toLowerCase().trim();
        const dateMatch = existing.date === event.date;
        const timeMatch = existing.start_time === event.startTime;
        
        // Handle format matching - existing events have formats as array or object
        const existingFormat = Array.isArray(existing.formats) ? existing.formats[0]?.name : existing.formats?.name;
        const formatMatch = (existingFormat || 'no-format') === (event.format || 'no-format');
        
        console.log(`Checking match for "${event.title}":`, {
          titleMatch,
          dateMatch, 
          timeMatch,
          formatMatch,
          existingTitle: existing.title,
          existingDate: existing.date,
          existingTime: existing.start_time,
          existingFormat,
          extractedFormat: event.format
        });
        
        // More flexible matching: exact title + date, or title + time, or title + date + format, or all four
        return (titleMatch && dateMatch) || 
               (titleMatch && timeMatch) || 
               (titleMatch && dateMatch && formatMatch) ||
               (dateMatch && timeMatch && titleMatch);
      });

      if (matchingEvent) {
        return {
          ...event,
          existingEventMatch: {
            isMatch: true,
            existingEventId: matchingEvent.id,
            similarityReason: `Matches existing event: ${matchingEvent.title} on ${matchingEvent.date} at ${matchingEvent.start_time}`
          }
        };
      }

      return {
        ...event,
        existingEventMatch: {
          isMatch: false
        }
      };
    });

    console.log('Events with enhanced matching:', eventsWithIds);
    
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

