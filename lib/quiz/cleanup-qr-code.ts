import { supabaseAdmin } from '@/utils/supabase'

/**
 * Delete QR code from storage and clear qr_code_url from challenge
 * @param qrCodeUrl - The QR code file path/name in storage
 * @param challengeId - The challenge ID (optional, for logging)
 * @returns Promise<boolean> - true if deletion was successful or no QR code existed, false on error
 */
export async function cleanupChallengeQRCode(
  qrCodeUrl: string | null | undefined,
  challengeId?: string
): Promise<boolean> {
  if (!qrCodeUrl) {
    // No QR code to delete
    return true
  }

  try {
    // For challenge QR codes, the qr_code_url is just the filename (e.g., "challenge-123456-1234567890.png")
    // Delete from challenge-qr-codes bucket
    const { error: deleteError } = await supabaseAdmin.storage
      .from('challenge-qr-codes')
      .remove([qrCodeUrl])

    if (deleteError) {
      console.error(
        `Error deleting QR code "${qrCodeUrl}" from storage${challengeId ? ` for challenge ${challengeId}` : ''}:`,
        deleteError
      )
      // Don't throw - we'll still try to clear the database field
    } else {
      console.log(
        `✅ Successfully deleted QR code "${qrCodeUrl}" from storage${challengeId ? ` for challenge ${challengeId}` : ''}`
      )
    }

    return true
  } catch (error) {
    console.error(
      `Error in cleanupChallengeQRCode for "${qrCodeUrl}"${challengeId ? ` (challenge ${challengeId})` : ''}:`,
      error
    )
    return false
  }
}

