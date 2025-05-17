// lib/evidenceService.ts

/**
 * Service for handling work evidence and verification
 * This service interacts directly with the verification API
 */

const API_URL = 'https://unlocked-base-backend-production.up.railway.app/task-verification';

/**
 * Send work evidence directly to verification API
 * @param task Title of the job
 * @param description Description of the job and deliverable
 * @param image Image file to verify
 * @returns Promise with the verification result
 */
export async function verifyEvidence(
  task: string,
  description: string,
  image: File
): Promise<{ result: string }> {
  // Create form data for the API request
  const formData = new FormData();
  formData.append('task', task);
  formData.append('description', description);
  formData.append('images', image);

  try {
    // Send request to API
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      // No need to set Content-Type as it's set automatically for FormData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling verification API:', error);
    throw error;
  }
}

/**
 * Parse the AI verification result
 * @param result The API result string
 * @returns Whether the verification passed
 */
export function parseVerificationResult(result: string): {
  verified: boolean;
  explanation: string;
} {
  // The API returns "Corresponding" or "Not Corresponding"
  // followed by an explanation
  const verified = result.toLowerCase().includes('corresponding') &&
                  !result.toLowerCase().includes('not corresponding');

  // Extract explanation - everything after the first sentence
  const parts = result.split('.');
  let explanation = '';

  if (parts.length > 1) {
    explanation = parts.slice(1).join('.').trim();
  } else {
    explanation = result;
  }

  return {
    verified,
    explanation: explanation || result // If splitting fails, return full result
  };
}
