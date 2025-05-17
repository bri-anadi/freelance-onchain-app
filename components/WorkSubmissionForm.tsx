// components/WorkSubmissionForm.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Info, CheckCircle } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkSubmissionFormProps {
  jobTitle: string;
  jobDescription: string;
  onSubmit: (deliverable: string, evidenceImage: File | null) => Promise<void>;
  isSubmitting: boolean;
  isVerifying: boolean;
}

export default function WorkSubmissionForm({
  jobTitle,
  jobDescription,
  onSubmit,
  isSubmitting,
  isVerifying
}: WorkSubmissionFormProps) {
  const [deliverable, setDeliverable] = useState('');
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!deliverable.trim()) return;
    await onSubmit(deliverable, evidenceImage);
  };

  const getButtonText = () => {
    if (isVerifying) return 'Verifying with AI...';
    if (isSubmitting) return 'Submitting Work...';
    return 'Submit Work';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Submit Work for {jobTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Describe the work you've completed and provide any relevant links or information.
        </p>
      </div>

      <Textarea
        placeholder="Describe your completed work and include any relevant links..."
        value={deliverable}
        onChange={(e) => setDeliverable(e.target.value)}
        className="min-h-[150px]"
        disabled={isSubmitting || isVerifying}
      />

      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-300 text-sm">
          This project uses automatic verification! If you provide an image of your work, it will be instantly verified by AI and can trigger immediate payment.
        </AlertDescription>
      </Alert>

      <div className="pt-2">
        <h4 className="text-sm font-medium mb-2">Add Proof of Work (for automatic payment)</h4>
        <ImageUploader
          onChange={(file) => setEvidenceImage(file)}
          disabled={isSubmitting || isVerifying}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Your work will be automatically verified by AI if you include an image. Successful verification can trigger an immediate partial payment.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || isVerifying || !deliverable.trim()}
        className="w-full"
      >
        {(isSubmitting || isVerifying) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {getButtonText()}
      </Button>

      {isVerifying && (
        <div className="text-center text-sm text-amber-600 dark:text-amber-400 animate-pulse">
          AI verification in progress... Please wait.
        </div>
      )}
    </div>
  );
}
