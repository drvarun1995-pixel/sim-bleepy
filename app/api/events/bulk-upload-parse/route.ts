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

    // Create prompt for OpenAI with comprehensive existing event data
    const prompt = `You are an AI assistant that extracts UNIQUE event information from documents.

CRITICAL REQUIREMENTS:
1. Extract ONLY UNIQUE events (no duplicates)
2. Each event must have: title, date, and start time
3. Do NOT create duplicate entries for the same event
4. If the same event appears multiple times in the document, extract it only ONCE

Your task is to extract the following information for each UNIQUE event:
- Event title (required)
- Event date in YYYY-MM-DD format (required)
- Start time in HH:MM 24-hour format (required)
- End time in HH:MM 24-hour format (optional)

MATCHING EXISTING DATA:
If location names are mentioned, try to match them with existing locations:
${existingLocations.map(l => `   - ${l.name} (ID: ${l.id})`).join('\n')}

If speaker names are mentioned, try to match them with existing speakers:
${existingSpeakers.map(s => `   - ${s.name}, ${s.role} (ID: ${s.id})`).join('\n')}

If category names are mentioned, try to match them with existing categories:
${existingCategories.map(c => `   - ${c.name} (ID: ${c.id})`).join('\n')}

If format names are mentioned, try to match them with existing formats:
${existingFormats.map(f => `   - ${f.name} (ID: ${f.id})`).join('\n')}

If organizer names are mentioned, try to match them with existing organizers:
${existingOrganizers.map(o => `   - ${o.name} (ID: ${o.id})`).join('\n')}

RULES:
- Do NOT create new locations, speakers, categories, formats, or organizers
- Do NOT extract email addresses
- Convert all times to 24-hour format (HH:MM)
- If date/time is unclear, skip that event
- Each event must have a unique title and date combination

EXISTING EVENTS IN DATABASE (for reference and comparison):
${existingEvents.map(event => {
  const speakers = event.event_speakers?.map((es: any) => es.speakers?.name).filter(Boolean).join(', ') || 'None';
  const location = Array.isArray(event.locations) ? event.locations[0]?.name : event.locations?.name;
  const format = Array.isArray(event.formats) ? event.formats[0]?.name : event.formats?.name;
  const category = Array.isArray(event.categories) ? event.categories[0]?.name : event.categories?.name;
  const organizer = Array.isArray(event.organizers) ? event.organizers[0]?.name : event.organizers?.name;
  
  return `   - "${event.title}" on ${event.date} at ${event.start_time}${event.end_time ? `-${event.end_time}` : ''}
     Location: ${location || 'None'}
     Format: ${format || 'None'}
     Category: ${category || 'None'}
     Organizer: ${organizer || 'None'}
     Speakers: ${speakers}`;
}).join('\n')}

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
          content: 'You are a helpful assistant that extracts structured event information from documents. Always return valid JSON. Extract only unique events with complete information (title, date, start time).'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent results
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

    // Deduplicate events based on title, date, and start time
    const uniqueEvents = [];
    const seenEvents = new Set();
    
    for (const event of eventsWithIds) {
      if (!event.title || !event.date || !event.startTime) {
        console.log('Skipping incomplete event:', event);
        continue; // Skip events missing required fields
      }
      
      const eventKey = `${event.title.toLowerCase().trim()}|${event.date}|${event.startTime}`;
      if (!seenEvents.has(eventKey)) {
        seenEvents.add(eventKey);
        uniqueEvents.push(event);
      } else {
        console.log('Skipping duplicate event:', event);
      }
    }

    eventsWithIds = uniqueEvents;
    console.log('Final unique events:', eventsWithIds);

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

