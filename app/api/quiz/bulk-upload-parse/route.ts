import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import OpenAI from 'openai'
import mammoth from 'mammoth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Email detection
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

function detectEmails(text: string): string[] {
  const emails = text.match(EMAIL_REGEX) || []
  return Array.from(new Set(emails))
}

function removeEmails(text: string): string {
  return text.replace(EMAIL_REGEX, '[EMAIL REMOVED]')
}

async function parseWordFile(buffer: Buffer): Promise<string> {
  try {
    // Extract text from Word document using mammoth
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('Error parsing Word file:', error)
    throw new Error('Failed to parse Word document. Please ensure it is a valid .docx file.')
  }
}

/**
 * Converts plain text explanation to HTML format for Tiptap editor
 * Handles sections like "Why others are incorrect:" and "References:"
 * Formats bullet points into proper HTML lists
 */
function formatExplanationAsHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '<p></p>'
  }

  let html = text.trim()

  // Replace escaped newlines with actual newlines if present
  html = html.replace(/\\n/g, '\n')

  // Split by "Why others are incorrect:" (case insensitive, with optional colon)
  const whyPattern = /Why others are incorrect:?\s*/i
  const whyIndex = html.search(whyPattern)
  
  if (whyIndex !== -1) {
    const mainExplanation = html.substring(0, whyIndex).trim()
    const afterWhy = html.substring(whyIndex).replace(whyPattern, '').trim()

    // Split by "References:" (case insensitive, with optional colon)
    const refPattern = /References:?\s*/i
    const refIndex = afterWhy.search(refPattern)
    
    let formatted = ''

    // Format main explanation
    if (mainExplanation) {
      formatted += `<p>${escapeHTML(mainExplanation)}</p>`
    }

    if (refIndex !== -1) {
      // Both "Why others are incorrect" and "References" sections exist
      const whyContent = afterWhy.substring(0, refIndex).trim()
      const refContent = afterWhy.substring(refIndex).replace(refPattern, '').trim()

      // Format "Why others are incorrect" section
      if (whyContent) {
        formatted += '<p><strong>Why others are incorrect:</strong></p>'
        
        // Extract bullet points - preserve option letters (A:, B:, etc.)
        const bullets = extractBulletPoints(whyContent, true) // true = keep option letters
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Why content:', whyContent.substring(0, 200))
          console.log('Extracted bullets:', bullets.length, bullets)
        }
        
        if (bullets.length > 0) {
          formatted += '<ul>'
          bullets.forEach(bullet => {
            formatted += `<li>${escapeHTML(bullet)}</li>`
          })
          formatted += '</ul>'
        } else {
          // If no bullets extracted, try to split by periods and option letters as fallback
          // Pattern: "A: text. B: text." -> split into bullets
          const fallbackBullets = splitByOptionLetters(whyContent)
          if (fallbackBullets.length > 0) {
            formatted += '<ul>'
            fallbackBullets.forEach(bullet => {
              formatted += `<li>${escapeHTML(bullet)}</li>`
            })
            formatted += '</ul>'
          } else {
            formatted += `<p>${escapeHTML(whyContent)}</p>`
          }
        }
      }

      // Format "References" section
      if (refContent) {
        formatted += '<p><strong>References:</strong></p>'
        
        // Extract bullet points - try multiple methods
        let refs = extractBulletPoints(refContent)
        
        // If no bullets found, try splitting references by common patterns
        if (refs.length === 0) {
          refs = splitReferences(refContent)
        }
        
        if (refs.length > 0) {
          formatted += '<ul>'
          refs.forEach(ref => {
            formatted += `<li>${escapeHTML(ref)}</li>`
          })
          formatted += '</ul>'
        } else {
          formatted += `<p>${escapeHTML(refContent)}</p>`
        }
      }
    } else {
      // Only "Why others are incorrect" section, no references
      if (afterWhy) {
        formatted += '<p><strong>Why others are incorrect:</strong></p>'
        
        // Extract bullet points - preserve option letters (A:, B:, etc.)
        const bullets = extractBulletPoints(afterWhy, true) // true = keep option letters
        
        if (bullets.length > 0) {
          formatted += '<ul>'
          bullets.forEach(bullet => {
            formatted += `<li>${escapeHTML(bullet)}</li>`
          })
          formatted += '</ul>'
        } else {
          // Fallback: try splitting by option letters
          const fallbackBullets = splitByOptionLetters(afterWhy)
          if (fallbackBullets.length > 0) {
            formatted += '<ul>'
            fallbackBullets.forEach(bullet => {
              formatted += `<li>${escapeHTML(bullet)}</li>`
            })
            formatted += '</ul>'
          } else {
            formatted += `<p>${escapeHTML(afterWhy)}</p>`
          }
        }
      }
    }

    return formatted || '<p></p>'
  }

  // No "Why others are incorrect" section found
  // Check for "References:" section
  const refPattern = /References:?\s*/i
  const refIndex = html.search(refPattern)
  
  if (refIndex !== -1) {
    const mainExplanation = html.substring(0, refIndex).trim()
    const refContent = html.substring(refIndex).replace(refPattern, '').trim()
    
    let formatted = mainExplanation ? `<p>${escapeHTML(mainExplanation)}</p>` : ''
    
    if (refContent) {
      formatted += '<p><strong>References:</strong></p>'
      
      // Extract bullet points - try multiple methods
      let refs = extractBulletPoints(refContent)
      
      // If no bullets found, try splitting references by common patterns
      if (refs.length === 0) {
        refs = splitReferences(refContent)
      }
      
      if (refs.length > 0) {
        formatted += '<ul>'
        refs.forEach(ref => {
          formatted += `<li>${escapeHTML(ref)}</li>`
        })
        formatted += '</ul>'
      } else {
        formatted += `<p>${escapeHTML(refContent)}</p>`
      }
    }
    
    return formatted || '<p></p>'
  }

  // No sections found, just format as paragraph(s)
  // Split by double newlines to create multiple paragraphs
  const paragraphs = html.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length > 1) {
    return paragraphs.map(p => `<p>${escapeHTML(p.trim())}</p>`).join('')
  }

  return `<p>${escapeHTML(html)}</p>`
}

/**
 * Extracts bullet points from text
 * Handles patterns like "• A: text", "A: text", "• text", "- text", etc.
 * @param text - The text to extract bullets from
 * @param keepOptionLetters - If true, preserves option letters (A:, B:, etc.) in "Why others are incorrect" section
 */
function extractBulletPoints(text: string, keepOptionLetters: boolean = false): string[] {
  const bullets: string[] = []
  
  if (!text || !text.trim()) {
    return bullets
  }

  // Check if text contains bullet characters (•)
  if (text.includes('•')) {
    // Split by bullet character (•) - handle both "• " and "•" patterns
    const parts = text.split(/(?:•\s*|•)/).filter(p => p.trim())
    
    parts.forEach(part => {
      let content = part.trim()
      
      // Only remove leading letter pattern if we don't want to keep option letters
      if (!keepOptionLetters) {
        content = content.replace(/^[A-E]:\s*/, '')
      }
      
      content = content.trim()
      
      if (content) {
        bullets.push(content)
      }
    })
    
    return bullets.filter(b => b.trim().length > 0)
  }

  // If keepOptionLetters is true, look for option letter patterns (A:, B:, C:, D:, E:)
  // This handles cases like "A: text. B: text. D: text. E: text."
  if (keepOptionLetters) {
    // Use the same logic as splitByOptionLetters for consistency
    const optionPattern = /\b([A-E]):\s+/g
    const matches = Array.from(text.matchAll(optionPattern))
    
    if (matches.length > 0) {
      // Extract each option with its content
      matches.forEach((match, index) => {
        const optionLetter = match[1]
        const contentStart = match.index! + match[0].length
        const contentEnd = index < matches.length - 1 
          ? matches[index + 1].index! 
          : text.length
        
        let content = text.substring(contentStart, contentEnd).trim()
        // Remove trailing period
        content = content.replace(/\.\s*$/, '').trim()
        
        if (content) {
          bullets.push(`${optionLetter}: ${content}`)
        }
      })
      
      if (bullets.length > 0) {
        return bullets.filter(b => b.trim().length > 0)
      }
    }
  }

  // Try hyphen as bullet indicator
  if (text.includes('-') && !keepOptionLetters) {
    const parts = text.split(/\s*-\s+/).filter(p => p.trim())
    parts.forEach(part => {
      const content = part.trim()
      if (content) {
        bullets.push(content)
      }
    })
    
    return bullets.filter(b => b.trim().length > 0)
  }

  // If no bullets found, return empty array (don't return the whole text)
  return []
}

/**
 * Fallback function to split text by option letters when extractBulletPoints doesn't work
 * Handles patterns like "A: text. B: text. D: text. E: text."
 */
function splitByOptionLetters(text: string): string[] {
  const bullets: string[] = []
  
  if (!text || !text.trim()) {
    return bullets
  }
  
  // Direct approach: find all occurrences of option letter pattern "A:", "B:", etc.
  // Use word boundary to ensure we match "A:" but not "FA:" or "A:BC"
  // Pattern matches: letter (A-E) followed by colon and space
  const optionPattern = /\b([A-E]):\s+/g
  const matches = Array.from(text.matchAll(optionPattern))
  
  if (matches.length === 0) {
    return bullets
  }
  
  // Extract each option with its content
  matches.forEach((match, index) => {
    const optionLetter = match[1]
    const matchStart = match.index!
    const contentStart = matchStart + match[0].length // Start after "A: "
    
    // Find the end of this option's content (start of next option or end of text)
    const contentEnd = index < matches.length - 1 
      ? matches[index + 1].index! 
      : text.length
    
    // Extract the content for this option
    let content = text.substring(contentStart, contentEnd).trim()
    
    // Remove trailing period if present (it's usually part of sentence structure)
    content = content.replace(/\.\s*$/, '').trim()
    
    if (content) {
      bullets.push(`${optionLetter}: ${content}`)
    }
  })
  
  return bullets.filter(b => b.trim().length > 0)
}

/**
 * Splits references text into individual references
 * Handles cases where references are separated by periods, bullet points, or are on separate lines
 */
function splitReferences(text: string): string[] {
  const refs: string[] = []
  
  if (!text || !text.trim()) {
    return refs
  }
  
  // Try splitting by bullet characters first
  if (text.includes('•')) {
    const parts = text.split(/•/).filter(p => p.trim())
    parts.forEach(part => {
      const trimmed = part.trim()
      if (trimmed) {
        refs.push(trimmed)
      }
    })
    if (refs.length > 0) {
      return refs
    }
  }
  
  // Try splitting by newlines first (most reliable)
  if (text.includes('\n')) {
    const lines = text.split(/\n+/).filter(line => line.trim())
    if (lines.length > 1) {
      return lines.map(line => line.trim()).filter(line => line.length > 0)
    }
  }
  
  // Try splitting by common organization/institute names that often start new references
  // Pattern: Look for organization names like "National Institute", "Oxford", etc.
  // that are typically at the start of a new reference
  const orgKeywords = [
    'National Institute',
    'Oxford',
    'Cambridge',
    'British Medical',
    'American Medical',
    'World Health',
    'Centers for Disease',
    'Royal College',
    'European Society',
    'American Heart',
    'American College',
    'British Heart',
    'NICE',
    'WHO',
    'CDC',
    'FDA',
  ]
  
  // Build pattern to match organization names (case-insensitive)
  const orgPattern = new RegExp(
    `(${orgKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  
  const orgMatches = Array.from(text.matchAll(orgPattern))
  
  if (orgMatches.length > 1) {
    // Split at organization name boundaries
    let lastIndex = 0
    orgMatches.forEach((match, index) => {
      if (index > 0) {
        // Extract reference before this organization
        const ref = text.substring(lastIndex, match.index!).trim()
        if (ref) {
          // Clean up: remove trailing periods that might be from previous reference
          const cleanedRef = ref.replace(/\.\s*$/, '').trim()
          if (cleanedRef) {
            refs.push(cleanedRef)
          }
        }
      }
      lastIndex = match.index!
    })
    
    // Add the last reference (from last organization to end)
    const lastRef = text.substring(lastIndex).trim()
    if (lastRef) {
      refs.push(lastRef)
    }
    
    if (refs.length >= 2) {
      return refs
    }
  }
  
  // Try splitting by patterns where a capital letter follows a period and space
  // This often indicates a new reference starting
  // Pattern: period, space, then capital letter (but not if it's part of an acronym)
  const periodCapitalPattern = /\.\s+([A-Z][a-z])/g
  const periodMatches = Array.from(text.matchAll(periodCapitalPattern))
  
  if (periodMatches.length > 0) {
    let lastIndex = 0
    periodMatches.forEach((match) => {
      // Check if this looks like the start of a new reference
      // (not just a sentence continuation)
      const beforeMatch = text.substring(Math.max(0, match.index! - 30), match.index!).trim()
      
      // If we see organization-like keywords or long text before, it's likely a new reference
      const looksLikeNewRef = orgKeywords.some(keyword => 
        beforeMatch.toLowerCase().includes(keyword.toLowerCase())
      ) || beforeMatch.length > 20
      
      if (looksLikeNewRef || periodMatches.length === 1) {
        const ref = text.substring(lastIndex, match.index! + 1).trim()
        if (ref) {
          refs.push(ref)
        }
        lastIndex = match.index! + 1
      }
    })
    
    // Add the last reference
    const lastRef = text.substring(lastIndex).trim()
    if (lastRef) {
      refs.push(lastRef)
    }
    
    // Only return if we found multiple references
    if (refs.length >= 2) {
      return refs
    }
  }
  
  // Last resort: Try splitting by long text patterns (references are usually 30+ characters)
  // Look for periods followed by capital letters where the preceding text is substantial
  const longTextPattern = /([A-Z][^.]{30,}?\.)(?=\s+[A-Z][a-z][^.]{20,})/g
  const longMatches = Array.from(text.matchAll(longTextPattern))
  
  if (longMatches.length > 0) {
    let lastIndex = 0
    longMatches.forEach((match) => {
      const ref = text.substring(lastIndex, match.index! + match[0].length).trim()
      if (ref) {
        refs.push(ref)
      }
      lastIndex = match.index! + match[0].length
    })
    
    const lastRef = text.substring(lastIndex).trim()
    if (lastRef) {
      refs.push(lastRef)
    }
    
    if (refs.length >= 2) {
      return refs
    }
  }
  
  // If nothing works, return empty array (will fall back to displaying as single paragraph)
  return []
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const autoDeleteEmails = formData.get('autoDeleteEmails') === 'true'
    const bulkCategory = formData.get('bulkCategory') as string
    const bulkDifficulty = formData.get('bulkDifficulty') as string
    const bulkStatus = formData.get('bulkStatus') as string
    const additionalAiPrompt = formData.get('additionalAiPrompt') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check file type - only Word documents
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return NextResponse.json({ 
        error: 'Only Word documents (.docx or .doc) are supported' 
      }, { status: 400 })
    }

    // Only support .docx for now (mammoth supports .docx)
    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      return NextResponse.json({ 
        error: 'Only .docx files are supported. Please convert your .doc file to .docx format.' 
      }, { status: 400 })
    }

    // Check file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024
    if (buffer.length > maxFileSize) {
      return NextResponse.json({
        error: `File is too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum file size is 10MB.`
      }, { status: 413 })
    }

    // Parse Word file to extract text
    let fileText = ''
    try {
      fileText = await parseWordFile(buffer)
      console.log(`Extracted ${fileText.length} characters from Word document`)
    } catch (error: any) {
      console.error('Error parsing Word file:', error)
      return NextResponse.json({
        error: error.message || 'Failed to parse Word document. Please ensure it is a valid .docx file.'
      }, { status: 400 })
    }

    if (!fileText || fileText.trim().length === 0) {
      return NextResponse.json({
        error: 'The Word document appears to be empty or could not be read. Please check the file and try again.'
      }, { status: 400 })
    }

    // Check if document is too large (roughly 100k characters = ~25k tokens, well within GPT-4o's limit)
    if (fileText.length > 500000) {
      console.warn(`Large document detected: ${fileText.length} characters. This may take longer to process.`)
      // Still process it, but log a warning
    }

    // Check for emails
    const detectedEmails = detectEmails(fileText)
    
    // If emails found and not auto-deleting, return warning
    if (detectedEmails.length > 0 && !autoDeleteEmails) {
      return NextResponse.json({
        error: 'File contains email addresses',
        emailsFound: detectedEmails
      }, { status: 400 })
    }

    // Remove emails if auto-delete is enabled
    if (autoDeleteEmails && fileText) {
      fileText = removeEmails(fileText)
    }

    // Get available categories from quiz_categories table
    const { data: categoryData } = await supabaseAdmin
      .from('quiz_categories')
      .select('name')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    const categoryList = categoryData?.map(cat => cat.name).join(', ') || ''

    // Prepare AI prompt - simpler approach: extract all explanation content until next question
    let prompt = `You are extracting Single Best Answer (SBA) medical questions from a Word document.

CRITICAL: Extract EVERY SINGLE question in the document. Do not skip any questions. Go through the entire document and extract all questions.

Available Categories: ${categoryList || 'Cardiology, Anatomy, Physiology, Pathology, Pharmacology, etc.'}

For each question found in the document, extract:
1. scenario_text: The clinical scenario or context (if present, otherwise use empty string)
2. question_text: The actual question being asked
3. option_a, option_b, option_c, option_d, option_e: All 5 answer options (A, B, C, D, E)
4. correct_answer: The correct answer (A, B, C, D, or E) - must match one of the options exactly
5. explanation_text: Extract ALL explanatory content for this question until the next question starts. This includes:
   - The main explanation of why the correct answer is correct
   - ALL text under "Why others are incorrect:" or similar headings (including ALL bullet points)
   - ALL text under "References:" or similar headings (including ALL citations)
   - Any additional notes, comments, or explanatory content related to this question
   - Extract everything that explains this question until you see the next question in the document
   - Preserve the text as it appears in the document - keep all content, bullet points, and references
   - If no explanation is in the document, generate a comprehensive medical explanation
6. category: Medical category (use from available categories or medical knowledge)
7. difficulty: "easy", "medium", or "hard" based on question complexity

SIMPLE RULE FOR explanation_text:
- Extract ALL text that explains this question from the document
- Start from where the explanation begins (usually after the answer options or correct answer)
- Continue extracting until you encounter the next question in the document
- Include EVERYTHING: main explanation, "Why others are incorrect" sections, "References" sections, bullet points, citations, notes - everything until the next question starts
- Preserve the text as it appears - don't try to reformat it, just extract it all

EXAMPLE:

{
  "questions": [
    {
      "scenario_text": "A 65-year-old African American male with type 2 diabetes presents with blood pressure of 150/95 mmHg.",
      "question_text": "What is the first-line antihypertensive treatment for this patient?",
      "option_a": "ACE inhibitor",
      "option_b": "Beta-blocker",
      "option_c": "Thiazide diuretic",
      "option_d": "Calcium channel blocker",
      "option_e": "ARB",
      "correct_answer": "D",
      "explanation_text": "For adults of Black African or African-Caribbean origin, calcium-channel blockers (e.g. amlodipine) are recommended as first-line therapy because of reduced renin activity and better response to these agents. Why others are incorrect: • A: ACE inhibitors are less effective in this population when used alone. • C: Thiazides are added if blood pressure remains uncontrolled after first-line therapy. • D: Beta-blockers are no longer used first-line unless there are coexisting indications such as angina. • E: ARBs are alternatives when ACE inhibitors are not tolerated, but not first-line for this group. References: • Cardiovascular Medicine, Oxford Handbook of Clinical Medicine • National Institute for Health and Care Excellence (2019). Hypertension in adults: diagnosis and management (NG136)",
      "category": "Cardiology",
      "difficulty": "medium"
    }
  ]
}

IMPORTANT RULES FOR EXTRACTION:
- Extract ALL questions from the document - count them as you go through the entire document
- Each question must have all 5 options (A, B, C, D, E)
- Each question must have a correct_answer (A, B, C, D, or E)
- scenario_text can be empty string if no scenario is provided
- For explanation_text: Extract ALL explanatory content for each question until the next question appears - include everything (main explanation, "Why others are incorrect", "References", all bullet points, all citations)
- Return the JSON object with the "questions" array containing ALL extracted questions with COMPLETE explanations`

    if (bulkCategory) {
      prompt += `\n\nIMPORTANT: Use "${bulkCategory}" as the category for all questions unless the document explicitly specifies a different category for a particular question.`
    }

    if (bulkDifficulty) {
      prompt += `\n\nIMPORTANT: Use "${bulkDifficulty}" as the difficulty for all questions unless the document explicitly specifies a different difficulty for a particular question.`
    }

    if (additionalAiPrompt && additionalAiPrompt.trim()) {
      prompt += `\n\nAdditional Instructions:\n${additionalAiPrompt.trim()}`
    }

    // Call OpenAI API with the extracted text
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting medical questions from documents. Extract ALL Single Best Answer (SBA) medical questions from the provided document. Return a JSON object with a "questions" array containing ALL questions found. Each question must have scenario_text, question_text, option_a through option_e, correct_answer, explanation_text, category, and difficulty. For explanation_text: Extract ALL explanatory content for each question until the next question starts in the document. Include everything: main explanation, "Why others are incorrect" sections with all bullet points, "References" sections with all citations, and any other explanatory content. Extract the text as it appears in the document - include all content until you see the next question. Do NOT skip any explanatory content. Do not skip any questions - extract every single question in the document. Count the questions as you extract them to ensure you get them all.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nDocument content (extract ALL questions from this. For each question, extract ALL explanation content until the next question starts):\n\n${fileText}`
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent extraction
      response_format: { type: 'json_object' } // Force JSON object response
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    let parsedResponse
    try {
      let cleanResponse = responseContent.trim()
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      parsedResponse = JSON.parse(cleanResponse)
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseContent.substring(0, 500))
      console.error('Parse error:', e)
      throw new Error('AI returned invalid JSON response. Please try again or check the document format.')
    }

    // Extract questions array from response
    let questions = []
    if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions
    } else if (Array.isArray(parsedResponse)) {
      // If response is directly an array
      questions = parsedResponse
    } else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      questions = parsedResponse.data
    } else if (typeof parsedResponse === 'object' && parsedResponse.question_text) {
      // If response is a single question object, wrap it in an array
      questions = [parsedResponse]
    } else {
      // Try to find any array in the response
      const responseStr = JSON.stringify(parsedResponse)
      const arrayMatch = responseStr.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          questions = JSON.parse(arrayMatch[0])
        } catch (e) {
          console.error('Failed to parse array from response')
        }
      }
    }

    if (questions.length === 0) {
      console.error('No questions extracted. Document text length:', fileText.length)
      console.error('First 1000 chars of document:', fileText.substring(0, 1000))
      return NextResponse.json({
        error: 'No questions were extracted from the document. Please ensure the document contains properly formatted medical questions with clear question text, options (A, B, C, D, E), and correct answers.',
        extractedTextPreview: fileText.substring(0, 1000) // Return first 1000 chars for debugging
      }, { status: 400 })
    }

    console.log(`Successfully extracted ${questions.length} questions from document`)

    // Validate and add temporary IDs
    questions = questions.map((q: any, index: number) => {
      // Get explanation text
      let explanationText = q.explanation_text || ''
      
      // Ensure it's a string
      if (typeof explanationText !== 'string') {
        explanationText = String(explanationText || '')
      }

      explanationText = explanationText.trim()

      // Convert plain text explanation to HTML format for Tiptap editor
      // This ensures proper formatting with sections, bullet points, etc.
      const explanationHTML = formatExplanationAsHTML(explanationText)
      
      return {
        ...q,
        id: `temp-${index}`,
        scenario_text: q.scenario_text || '',
        explanation_text: explanationHTML, // Store as HTML for Tiptap editor
        category: q.category || bulkCategory || 'General Medicine',
        difficulty: q.difficulty || bulkDifficulty || 'medium',
        status: (bulkStatus === 'published' ? 'published' : 'draft'),
        errors: []
      }
    })

    // Validate each question
    questions = questions.map((q: any) => {
      const errors: string[] = []
      if (!q.question_text || q.question_text.trim() === '') {
        errors.push('Missing question text')
      }
      if (!q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.option_e) {
        errors.push('Missing one or more answer options')
      }
      if (!q.correct_answer || !['A', 'B', 'C', 'D', 'E'].includes(q.correct_answer)) {
        errors.push('Invalid or missing correct answer')
      }
      if (!q.explanation_text || q.explanation_text.trim() === '') {
        errors.push('Missing explanation')
      }
      if (!q.category || q.category.trim() === '') {
        errors.push('Missing category')
      }
      if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        errors.push('Invalid difficulty')
      }
      return { ...q, errors, isValid: errors.length === 0 }
    })

    return NextResponse.json({
      questions,
      emailsFound: detectedEmails,
      totalExtracted: questions.length,
      validQuestions: questions.filter((q: any) => q.isValid).length
    })
  } catch (error: any) {
    console.error('Error in bulk upload parse:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process file' 
    }, { status: 500 })
  }
}
