// lib/autoVerificationService.ts

import { verifyEvidence, parseVerificationResult } from './evidenceService';

/**
 * Service for handling fully automatic verification of work submissions
 */

/**
 * Automatically verify a work submission using AI and trigger contract verification
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 * @param jobDescription Description of the job
 * @param deliverable The submitted deliverable text
 * @param evidenceImage The submitted evidence image
 * @param verifyOnChain Function to call to verify the submission on-chain
 * @param submissionId Optional submission ID for direct contract verification
 * @returns Promise with verification result or null if no image provided
 */
export async function autoVerifySubmission(
  jobId: number,
  jobTitle: string,
  jobDescription: string,
  deliverable: string,
  evidenceImage: File | null,
  verifyOnChain?: (submissionId: number, verified: boolean) => Promise<any>,
  submissionId?: number
): Promise<{
  verified: boolean;
  explanation: string;
  verifiedOnChain: boolean;
} | null> {
  // If no evidence image is provided, we can't perform verification
  if (!evidenceImage) {
    console.log('No evidence image provided for auto-verification');
    return null;
  }

  try {
    console.log(`Auto-verifying submission for job #${jobId}`);

    // Combine job description and deliverable for context
    const fullDescription = `Job Description: ${jobDescription}\n\nDeliverable Submitted: ${deliverable}`;

    // Call the verification API
    const response = await verifyEvidence(
      jobTitle,
      fullDescription,
      evidenceImage
    );

    // Parse the result
    const result = parseVerificationResult(response.result);

    console.log(`Auto-verification result: ${result.verified ? 'Verified' : 'Not Verified'}`);
    console.log(`Explanation: ${result.explanation}`);

    // If we have a submissionId and a verification function, automatically verify on-chain
    let verifiedOnChain = false;
    if (submissionId && verifyOnChain && result.verified) {
      try {
        console.log(`Automatically verifying submission #${submissionId} on-chain`);
        await verifyOnChain(submissionId, true);
        verifiedOnChain = true;
        console.log(`On-chain verification successful`);
      } catch (error) {
        console.error('Error during on-chain verification:', error);
      }
    }

    return {
      ...result,
      verifiedOnChain
    };
  } catch (error) {
    console.error('Error during auto-verification:', error);
    // Return null in case of error
    return null;
  }
}
