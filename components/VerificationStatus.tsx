// components/VerificationStatus.tsx

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, Clock, CircleSlash, Zap } from 'lucide-react';

interface VerificationStatusProps {
  aiVerified: boolean | null;
  paymentReleased: boolean;
  hasEvidence: boolean;
  verificationNote?: string;
}

export default function VerificationStatus({
  aiVerified,
  paymentReleased,
  hasEvidence,
  verificationNote
}: VerificationStatusProps) {

  // Determine AI verification status
  const getAiVerificationBadge = () => {
    // No evidence provided, so no AI verification
    if (!hasEvidence) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 font-normal">
          <CircleSlash className="h-3 w-3" />
          <span>No Verification</span>
        </Badge>
      );
    }

    // Evidence provided but AI verification is pending
    if (aiVerified === null) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Verification Pending</span>
        </Badge>
      );
    }

    // AI verified successfully
    if (aiVerified === true) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="default" className="bg-green-600 hover:bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Auto-Verified</span>
              </Badge>
            </TooltipTrigger>
            {verificationNote && (
              <TooltipContent className="max-w-sm">
                <p>{verificationNote}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }

    // AI verification failed
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Verification Failed</span>
            </Badge>
          </TooltipTrigger>
          {verificationNote && (
            <TooltipContent className="max-w-sm">
              <p>{verificationNote}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Determine payment status
  const getPaymentBadge = () => {
    if (paymentReleased) {
      return (
        <Badge variant="default" className="bg-blue-600 hover:bg-blue-500 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>Payment Released</span>
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Payment Pending</span>
      </Badge>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {getAiVerificationBadge()}
      {getPaymentBadge()}
    </div>
  );
}
