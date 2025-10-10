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

    // Fetch existing data from database
    const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes] = await Promise.all([
      supabaseAdmin.from('locations').select('id, name'),
      supabaseAdmin.from('speakers').select('id, name, role'),
      supabaseAdmin.from('categories').select('id, name, color'),
      supabaseAdmin.from('formats').select('id, name'),
      supabaseAdmin.from('organizers').select('id, name')
    ]);

    const existingLocations = locationsRes.data || [];
    const existingSpeakers = speakersRes.data || [];
    const existingCategories = categoriesRes.data || [];
    const existingFormats = formatsRes.data || [];
    const existingOrganizers = organizersRes.data || [];

    // Create prompt for OpenAI
    const prompt = `You are an AI assistant that extracts event information from documents. 
    
Your task is to extract ONLY the following information from the provided document:
- Event title
- Event date (in YYYY-MM-DD format)
- Start time (in HH:MM 24-hour format)
- End time (in HH:MM 24-hour format, if available)

IMPORTANT RULES:
1. ONLY extract event titles, dates, and times. Do NOT create or suggest any other information.
2. If location names are mentioned, try to match them with this list of existing locations:
${existingLocations.map(l => `   - ${l.name} (ID: ${l.id})`).join('\n')}
3. If speaker names are mentioned, try to match them with this list of existing speakers:
${existingSpeakers.map(s => `   - ${s.name}, ${s.role} (ID: ${s.id})`).join('\n')}
4. Do NOT create new locations or speakers - only match existing ones from the lists above.
5. Do NOT extract or include email addresses.
6. If a date is ambiguous or unclear, try to infer it from context.
7. Convert all times to 24-hour format (HH:MM).

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
    "speakerIds": ["uuid1", "uuid2"],
    "speakers": ["speaker name 1", "speaker name 2"]
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
          content: 'You are a helpful assistant that extracts structured event information from documents. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

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

