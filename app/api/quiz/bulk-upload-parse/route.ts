import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'

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

async function parseExcelFile(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  let text = ''
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    text += `\nSheet: ${sheetName}\n${csv}\n`
  })
  
  return text
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const autoDeleteEmails = formData.get('autoDeleteEmails') === 'true'
    const bulkCategory = formData.get('bulkCategory') as string
    const bulkDifficulty = formData.get('bulkDifficulty') as string
    const additionalAiPrompt = formData.get('additionalAiPrompt') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return NextResponse.json({ 
        error: 'Only Excel, PDF, or Word files are supported' 
      }, { status: 400 })
    }

    // Check file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024
    if (buffer.length > maxFileSize) {
      return NextResponse.json({
        error: `File is too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum file size is 10MB.`
      }, { status: 413 })
    }

    // Parse file for email checking
    let fileText = ''
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      fileText = await parseExcelFile(buffer)
    } else {
      // For PDF/Word, we'd need additional parsing libraries
      // For now, we'll process them through OpenAI
      fileText = 'File content will be processed by AI'
    }

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

    // Prepare AI prompt
    let prompt = `Extract Single Best Answer (SBA) medical questions from the attached file. Return a JSON array like this:

[
  {
    "scenario_text": "A 45-year-old patient presents with chest pain...",
    "question_text": "What is the most likely diagnosis?",
    "option_a": "Myocardial infarction",
    "option_b": "Pulmonary embolism",
    "option_c": "Aortic dissection",
    "option_d": "Pericarditis",
    "option_e": "Gastroesophageal reflux",
    "correct_answer": "A",
    "explanation_text": "The patient's presentation is consistent with...",
    "category": "Cardiology",
    "difficulty": "medium",
  }
]

Available Categories: ${categoryList || 'Cardiology, Anatomy, Physiology, Pathology, Pharmacology, etc.'}

Rules:
1. Extract scenario/context paragraph (if present)
2. Extract the question text
3. Extract all 5 answer options (A, B, C, D, E)
4. Identify the correct answer (A, B, C, D, or E) - this should match one of the options exactly
5. Extract explanation text - this should explain WHY the correct answer is correct and may include:
   - Why the correct answer is the best choice
   - Why other options are incorrect (if mentioned in the document)
   - Key clinical reasoning or medical facts
   - References to guidelines or protocols (if mentioned)
   - If no explanation is provided in the document, generate a brief medical explanation
6. Assign appropriate category from available categories or use medical subject knowledge
7. Assign difficulty: "easy", "medium", or "hard" based on complexity
8. If scenario_text is not present, use an empty string
9. Ensure all 5 options are provided
10. The explanation_text field is REQUIRED and should be comprehensive
11. Only extract data that is explicitly mentioned in the document (except explanations which can be generated if missing)
12. Return only the JSON array, no other text`

    if (bulkCategory) {
      prompt += `\n\nIMPORTANT: Use "${bulkCategory}" as the category for all questions unless the document specifies a different category.`
    }

    if (bulkDifficulty) {
      prompt += `\n\nIMPORTANT: Use "${bulkDifficulty}" as the difficulty for all questions unless the document specifies a different difficulty.`
    }


    if (additionalAiPrompt && additionalAiPrompt.trim()) {
      prompt += `\n\nAdditional Instructions:\n${additionalAiPrompt.trim()}`
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract Single Best Answer medical questions from documents. Return a JSON array with scenario_text, question_text, option_a through option_e, correct_answer, explanation_text, category, and difficulty. The explanation_text field is REQUIRED and should explain why the correct answer is correct. If no explanation is provided in the document, generate a brief medical explanation based on the question content.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${fileText || 'File content will be processed by AI'}`
        }
      ],
      temperature: 0.05
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    let parsedResponse
    try {
      let cleanResponse = responseContent.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      parsedResponse = JSON.parse(cleanResponse)
    } catch (e) {
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('AI returned invalid JSON response')
      }
    }

    // Extract questions array
    let questions = []
    if (Array.isArray(parsedResponse)) {
      questions = parsedResponse
    } else if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions
    } else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      questions = parsedResponse.data
    }

    // Validate and add temporary IDs
    questions = questions.map((q: any, index: number) => ({
      ...q,
      id: `temp-${index}`,
      scenario_text: q.scenario_text || '',
      explanation_text: q.explanation_text || '',
      category: q.category || bulkCategory || 'General Medicine',
      difficulty: q.difficulty || bulkDifficulty || 'medium',
      status: 'draft',
      errors: []
    }))

    // Validate each question
    questions = questions.map((q: any) => {
      const errors: string[] = []
      if (!q.question_text) errors.push('Missing question text')
      if (!q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.option_e) {
        errors.push('Missing one or more answer options')
      }
      if (!q.correct_answer || !['A', 'B', 'C', 'D', 'E'].includes(q.correct_answer)) {
        errors.push('Invalid or missing correct answer')
      }
      if (!q.explanation_text) errors.push('Missing explanation')
      if (!q.category) errors.push('Missing category')
      if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        errors.push('Invalid difficulty')
      }
      return { ...q, errors, isValid: errors.length === 0 }
    })

    return NextResponse.json({
      questions,
      emailsFound: detectedEmails
    })
  } catch (error: any) {
    console.error('Error in bulk upload parse:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process file' 
    }, { status: 500 })
  }
}

