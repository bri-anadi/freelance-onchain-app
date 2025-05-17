// components/WorkSubmissionForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

interface WorkSubmissionFormProps {
  jobTitle: string;
  onSubmit: (deliverable: string, evidenceImage: File | null) => Promise<void>;
  isSubmitting: boolean;
}

export default function WorkSubmissionForm({
  jobTitle,
  onSubmit,
  isSubmitting
}: WorkSubmissionFormProps) {
  const [deliverable, setDeliverable] = useState('');
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!deliverable.trim()) return;
    await onSubmit(deliverable, evidenceImage);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Submit Work for {jobTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Describe the work you've completed and provide any relevant links or information.
          Adding visual evidence increases your chances of quick AI verification.
        </p>
      </div>

      <Textarea
        placeholder="Describe your completed work and include any relevant links..."
        value={deliverable}
        onChange={(e) => setDeliverable(e.target.value)}
        className="min-h-[150px]"
        disabled={isSubmitting}
      />

      <div className="pt-2">
        <h4 className="text-sm font-medium mb-2">Add Proof of Work (recommended)</h4>
        <ImageUploader
          onChange={(file) => setEvidenceImage(file)}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Adding visual evidence increases the chances of your work being verified quickly by our AI system.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !deliverable.trim()}
        className="w-full"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Work
      </Button>
    </div>
  );
}
