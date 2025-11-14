import { supabaseAdmin } from '@/utils/supabase'

const QUIZ_IMAGES_BUCKET = 'quiz-images'
const LIST_LIMIT = 1000

interface QuestionAssetRecord {
  id: string
  scenario_image_url?: string | null
  explanation_image_url?: string | null
  scenario_text?: string | null
  explanation_text?: string | null
  asset_folder_id?: string | null
}

interface CampaignSectionInfo {
  id: string
  title: string
  campaign_id: string
  question_ids: string[]
}

interface DeleteQuestionOptions {
  confirmed?: boolean
}

export type DeleteQuestionResult =
  | { status: 'not-found'; error: string }
  | { status: 'campaign-blocked'; error: string; usedIn: { sectionId: string; sectionTitle: string; campaignId: string }[] }
  | { status: 'incomplete-sessions'; error: string; incompleteSessions: number }
  | { status: 'needs-confirmation'; message: string; completedSessions: number; challengeCount: number }
  | { status: 'error'; error: string; details?: string }
  | { status: 'success'; message: string; questionId: string }

const listFolderEntries = async (prefix: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(QUIZ_IMAGES_BUCKET)
    .list(prefix, { limit: LIST_LIMIT, sortBy: { column: 'name', order: 'asc' } })

  if (error || !data) {
    if (error) {
      console.error('[QuizCleanup] Failed to list entries for prefix', prefix, error)
    }
    return []
  }

  if (data.length === LIST_LIMIT) {
    console.warn('[QuizCleanup] Folder listing reached limit for prefix', prefix)
  }

  return data
}

const collectFilesRecursively = async (prefix: string): Promise<string[]> => {
  const entries = await listFolderEntries(prefix)
  if (!entries.length) {
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.metadata === null) {
      const nested = await collectFilesRecursively(fullPath)
      files.push(...nested)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

const removePaths = async (paths: string[]) => {
  if (!paths.length) return
  try {
    await supabaseAdmin.storage.from(QUIZ_IMAGES_BUCKET).remove(paths)
  } catch (error) {
    console.error('Failed to remove quiz image paths:', paths, error)
  }
}

export const cleanupFolder = async (prefix: string) => {
  const files = await collectFilesRecursively(prefix)
  if (files.length === 0) {
    return
  }
  await removePaths(files)
}

const normalizePath = (path?: string | null) => {
  if (!path) return null
  if (path.startsWith('http')) {
    const trimmed = path.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/quiz-images\//, '')
    return trimmed.replace(/^quiz-images\//, '').replace(/^\/+/, '')
  }
  return path.replace(/^quiz-images\//, '').replace(/^\/+/, '')
}

const addFoldersFromHtml = (html: string | null | undefined, targetSet: Set<string>) => {
  if (!html) return
  const pathRegex = /path=([^"&\s]+)/g
  let match: RegExpExecArray | null
  while ((match = pathRegex.exec(html)) !== null) {
    const encodedPath = match[1]
    try {
      const decoded = decodeURIComponent(encodedPath)
      const parts = decoded.split('/').filter(Boolean)
      if (parts.length >= 2) {
        targetSet.add(`${parts[0]}/${parts[1]}`)
      }
    } catch (error) {
      console.error('Failed to decode image path from HTML', error)
    }
  }
}

export const cleanupQuestionAssets = async (question: QuestionAssetRecord) => {
  const folderPrefixes = new Set<string>([`questions/${question.id}`])
  console.log('[QuizCleanup] Starting cleanup for question:', question.id)

  ;[question.scenario_image_url, question.explanation_image_url]
    .map(normalizePath)
    .forEach((normalized) => {
      if (!normalized) return
      const parts = normalized.split('/').filter(Boolean)
      if (parts.length >= 1) {
        const childPrefix = parts.slice(0, parts.length - 1).join('/')
        if (childPrefix) {
          folderPrefixes.add(childPrefix)
        }
      }
    })

  if (question.asset_folder_id) {
    folderPrefixes.add(`questions/${question.asset_folder_id}`)
  }

  addFoldersFromHtml(question.scenario_text, folderPrefixes)
  addFoldersFromHtml(question.explanation_text, folderPrefixes)

  for (const prefix of Array.from(folderPrefixes)) {
    console.log('[QuizCleanup] Processing folder prefix:', prefix)
    const files = await collectFilesRecursively(prefix)
    console.log('[QuizCleanup] Files collected for prefix:', prefix, files)
    if (files.length > 0) {
      await removePaths(files)
    }
  }

  const legacyPaths = [question.scenario_image_url, question.explanation_image_url]
    .map(normalizePath)
    .map((path) => (path ? path.replace(/^questions\/[^/]+\/questions\//, 'questions/') : path))
    .filter((path): path is string => Boolean(path))

  if (legacyPaths.length > 0) {
    await removePaths(legacyPaths)
  }
}

const replaceFolderReferences = (value: string | null | undefined, sourceFolder: string, targetFolder: string) => {
  if (!value) return value
  let updated = value
  const sourcePrefix = `questions/${sourceFolder}`
  const targetPrefix = `questions/${targetFolder}`
  const encodedSource = encodeURIComponent(sourcePrefix)
  const encodedTarget = encodeURIComponent(targetPrefix)

  if (updated.includes(sourcePrefix)) {
    updated = updated.replace(new RegExp(sourcePrefix, 'g'), targetPrefix)
  }
  if (updated.includes(encodedSource)) {
    updated = updated.replace(new RegExp(encodedSource, 'g'), encodedTarget)
  }
  return updated
}

export const finalizeQuestionAssetFolder = async (
  question: QuestionAssetRecord & { asset_folder_id: string | null }
): Promise<QuestionAssetRecord> => {
  const currentFolder = question.asset_folder_id || question.id
  const desiredFolder = question.id

  if (!currentFolder || currentFolder === desiredFolder) {
    if (question.asset_folder_id !== desiredFolder) {
      await supabaseAdmin
        .from('quiz_questions')
        .update({ asset_folder_id: desiredFolder })
        .eq('id', question.id)
    }
    return { ...question, asset_folder_id: desiredFolder }
  }

  const sourcePrefix = `questions/${currentFolder}`
  const targetPrefix = `questions/${desiredFolder}`
  const files = await collectFilesRecursively(sourcePrefix)

  for (const file of files) {
    const destinationPath = file.replace(sourcePrefix, targetPrefix)
    if (destinationPath === file) continue
    const { error } = await supabaseAdmin.storage.from(QUIZ_IMAGES_BUCKET).move(file, destinationPath)
    if (error) {
      console.error(`Failed to move quiz image from ${file} to ${destinationPath}`, error)
    }
  }

  const updatedScenarioImageUrl = replaceFolderReferences(question.scenario_image_url, currentFolder, desiredFolder)
  const updatedExplanationImageUrl = replaceFolderReferences(question.explanation_image_url, currentFolder, desiredFolder)
  const updatedScenarioText = replaceFolderReferences(question.scenario_text, currentFolder, desiredFolder)
  const updatedExplanationText = replaceFolderReferences(question.explanation_text, currentFolder, desiredFolder)

  const updates: Record<string, any> = {
    asset_folder_id: desiredFolder,
  }

  if (updatedScenarioImageUrl !== question.scenario_image_url) {
    updates.scenario_image_url = updatedScenarioImageUrl
  }
  if (updatedExplanationImageUrl !== question.explanation_image_url) {
    updates.explanation_image_url = updatedExplanationImageUrl
  }
  if (updatedScenarioText !== question.scenario_text) {
    updates.scenario_text = updatedScenarioText
  }
  if (updatedExplanationText !== question.explanation_text) {
    updates.explanation_text = updatedExplanationText
  }

  let finalQuestion = { ...question, ...updates }

  if (Object.keys(updates).length > 1) {
    const { data: refreshed, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(updates)
      .eq('id', question.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update question asset references after moving folders', error)
    } else if (refreshed) {
      finalQuestion = refreshed
    }
  } else if (!question.asset_folder_id || question.asset_folder_id !== desiredFolder) {
    await supabaseAdmin
      .from('quiz_questions')
      .update({ asset_folder_id: desiredFolder })
      .eq('id', question.id)
  }

  // Clean up leftover folder (if any)
  await cleanupFolder(sourcePrefix)

  return finalQuestion
}

export const cleanupDraftFolderById = async (folderId: string) => {
  if (!folderId) return
  await cleanupFolder(`questions/${folderId}`)
}

export const deleteQuestionById = async (
  id: string,
  options: DeleteQuestionOptions = {}
): Promise<DeleteQuestionResult> => {
  const confirmed = options.confirmed ?? false

  const { data: questionRecord } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, scenario_image_url, explanation_image_url, scenario_text, explanation_text, asset_folder_id')
      .eq('id', id)
      .single()

  if (!questionRecord) {
    return { status: 'not-found', error: 'Question not found' }
  }

  // Campaign usage check
  let campaignSections: CampaignSectionInfo[] = []
  try {
    const { data: allSections, error: campaignError } = await supabaseAdmin
      .from('quiz_campaign_sections')
      .select('id, title, campaign_id, question_ids')

    if (campaignError) {
      console.error('Error checking campaign sections:', campaignError)
    } else if (allSections) {
      campaignSections = (allSections as CampaignSectionInfo[]).filter(
        (section) => section.question_ids && Array.isArray(section.question_ids) && section.question_ids.includes(id)
      )
    }
  } catch (error) {
    console.error('Error checking campaign sections:', error)
  }

  if (campaignSections.length > 0) {
    return {
      status: 'campaign-blocked',
      error: 'This question is used in campaign sections. Please remove it from campaigns first.',
      usedIn: campaignSections.map((section) => ({
        sectionId: section.id,
        sectionTitle: section.title,
        campaignId: section.campaign_id,
      })),
    }
  }

  const { data: practiceAnswers, error: practiceError } = await supabaseAdmin
    .from('quiz_practice_answers')
    .select('id, session_id')
    .eq('question_id', id)

  if (practiceError) {
    console.error('Error checking practice answers:', practiceError)
  }

  let incompleteSessionCount = 0
  let completedSessionCount = 0

  if (practiceAnswers && practiceAnswers.length > 0) {
    const sessionIds = Array.from(new Set(practiceAnswers.map((a: any) => a.session_id)))
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .select('id, completed')
      .in('id', sessionIds)

    if (sessionsError) {
      console.error('Error checking session status:', sessionsError)
    } else if (sessions) {
      incompleteSessionCount = sessions.filter((s: any) => !s.completed).length
      completedSessionCount = sessions.filter((s: any) => s.completed).length
    }
  }

  const { data: challengeAnswers, error: challengeError } = await supabaseAdmin
    .from('quiz_challenge_answers')
    .select('id, challenge_id')
    .eq('question_id', id)

  if (challengeError) {
    console.error('Error checking challenge answers:', challengeError)
  }

  const challengeCount = challengeAnswers?.length || 0
  const practiceSessionCount = practiceAnswers?.length || 0

  if (incompleteSessionCount > 0) {
    return {
      status: 'incomplete-sessions',
      error: `This question is currently being used in ${incompleteSessionCount} active practice session(s). Please wait for these sessions to complete before deleting.`,
      incompleteSessions: incompleteSessionCount,
    }
  }

  const hasUsage = practiceSessionCount > 0 || challengeCount > 0

  if (hasUsage && !confirmed) {
    return {
      status: 'needs-confirmation',
      message: `This question has been used in ${completedSessionCount} completed practice session(s) and ${challengeCount} challenge(s). Deleting will remove all answer records but preserve session data.`,
      completedSessions: completedSessionCount,
      challengeCount,
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('quiz_questions')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting question:', deleteError)
    if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
      return {
        status: 'error',
        error: 'This question is referenced by other records. Please run the database migration to enable cascade deletes, or archive the question instead.',
        details: deleteError.message,
      }
    }
    return {
      status: 'error',
      error: 'Failed to delete question',
      details: deleteError.message,
    }
  }

  await cleanupQuestionAssets(questionRecord)

  return {
    status: 'success',
    questionId: id,
    message: hasUsage
      ? `Question deleted successfully. ${completedSessionCount} answer record(s) from completed sessions and ${challengeCount} challenge answer(s) have been removed. Session data has been preserved.`
      : 'Question deleted successfully.',
  }
}


