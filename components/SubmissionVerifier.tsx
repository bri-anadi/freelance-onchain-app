// components/SubmissionVerifier.tsx

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { verifyEvidence, parseVerificationResult } from '@/lib/evidenceService';

interface SubmissionVerifierProps {
  jobTitle: string;
  jobDescription: string;
  deliverable: string;
  onVerify: (verified: boolean, aiExplanation: string) => void;
  isProcessing: boolean;
}

export default function SubmissionVerifier({
  jobTitle,
  jobDescription,
  deliverable,
  onVerify,
  isProcessing
}: SubmissionVerifierProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<{
    verified: boolean;
    explanation: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);

      // Create an image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle AI verification
  const handleAiVerify = async () => {
    if (!image) return;

    try {
      setIsVerifying(true);

      // Combine job description and deliverable for context
      const fullDescription = `Job Description: ${jobDescription}\n\nDeliverable Submitted: ${deliverable}`;

      // Call the verification API
      const response = await verifyEvidence(
        jobTitle,
        fullDescription,
        image
      );

      // Parse the result
      const result = parseVerificationResult(response.result);
      setAiResult(result);

    } catch (error) {
      console.error('Verification error:', error);
      // Set error state
      setAiResult({
        verified: false,
        explanation: 'Error processing verification. Please try again or verify manually.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md text-sm">
        <h4 className="font-medium mb-1">Deliverable for Verification:</h4>
        <div className="whitespace-pre-wrap">{deliverable}</div>
      </div>

      <div className="border rounded-md p-4">
        <h4 className="text-sm font-medium mb-2">Upload Evidence Image for AI Verification</h4>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {!imagePreview ? (
          <div
            className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleUploadClick}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload proof of work (PNG, JPG)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Evidence"
                className="max-h-64 mx-auto rounded-md"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                  setAiResult(null);
                }}
              >
                Change
              </Button>
            </div>

            {!aiResult && (
              <Button
                onClick={handleAiVerify}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify with AI
              </Button>
            )}
          </div>
        )}
      </div>

      {aiResult && (
        <Card className={`p-4 ${aiResult.verified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
          <div className="flex items-start gap-3">
            {aiResult.verified ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            )}
            <div>
              <h3 className="font-medium">
                {aiResult.verified ? 'AI Verification Passed' : 'AI Verification Needs Review'}
              </h3>
              <p className="text-sm mt-1">{aiResult.explanation}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex space-x-2 w-full pt-4">
        <Button
          variant="destructive"
          onClick={() => onVerify(false, aiResult?.explanation || '')}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
        <Button
          variant="default"
          onClick={() => onVerify(true, aiResult?.explanation || '')}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle className="mr-2 h-4 w-4" />
          Verify
        </Button>
      </div>
    </div>
  );
}
