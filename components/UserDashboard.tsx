// components/UserDashboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { formatEther, calculateTimeLeft, JobStatus, ApplicationStatus } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Info } from 'lucide-react';

// Import components
import WorkSubmissionForm from '@/components/WorkSubmissionForm';
import JobApplicationsView from '@/components/JobApplicationsView';
import VerificationStatus from '@/components/VerificationStatus';

// Import services
import { autoVerifySubmission } from '@/lib/autoVerificationService';

export default function UserDashboard() {
  const { address, isConnected } = useAccount();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [verifyingWork, setVerifyingWork] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [viewingJobApplications, setViewingJobApplications] = useState<{ id: number, title: string } | null>(null);
  const { toast } = useToast();

  // Use contract hooks
  const {
    loading,
    getUserApplications,
    getUserPostedJobs,
    getUserSubmissions,
    getJob,
    getJobSubmission
  } = useContractRead();

  const {
    submitWork,
    verifyWorkByAI,
    cancelJob,
    isWritePending
  } = useContractWrite();

  // State for dashboard data
  const [applications, setApplications] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected || !address) return;

      try {
        setLoadingDashboard(true);

        // Fetch user applications, posted jobs, and submissions
        const [
          userApplications,
          userPostedJobs,
          userSubmissions
        ] = await Promise.all([
          getUserApplications(address),
          getUserPostedJobs(address),
          getUserSubmissions(address)
        ]);

        setApplications(userApplications);
        setPostedJobs(userPostedJobs);
        setSubmissions(userSubmissions);
        setLoadingDashboard(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoadingDashboard(false);
        toast({
          title: 'Error Fetching Data',
          description: 'There was an error loading your dashboard. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchUserData();
  }, [isConnected, address]);

  // Handle submit work with auto-verification
  const handleSubmitWork = async (jobId: number, deliverableText: string, evidenceImage: File | null) => {
    if (!isConnected || !deliverableText.trim()) return;

    try {
      setSubmittingWork(true);

      // Format the deliverable
      let finalDeliverable = deliverableText;
      let verificationResult = null;
      let submissionId = null; // We'll get this after submitting

      // Step 1: Submit the work to the contract
      const hash = await submitWork(jobId, finalDeliverable);

      if (typeof hash === 'string') {
        setTxHash(hash);

        // Wait briefly for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          // Try to get the submission ID
          const submission = await getJobSubmission(jobId);
          if (submission) {
            submissionId = submission.id;
            console.log(`Submission created with ID: ${submissionId}`);
          }
        } catch (error) {
          console.error('Error fetching submission ID:', error);
        }
      }

      // Step 2: If an image is provided, attempt auto-verification
      if (evidenceImage && submissionId) {
        setVerifyingWork(true);

        // Get the job details for verification context
        const job = await getJob(jobId);

        if (job) {
          // Attempt automatic verification and on-chain verification in one step
          verificationResult = await autoVerifySubmission(
            jobId,
            job.title,
            job.description,
            deliverableText,
            evidenceImage,
            verifyWorkByAI, // This will automatically call the contract if verification passes
            submissionId
          );

          if (verificationResult) {
            // Add verification result to the deliverable
            const verificationNote = `\n\n[AI Verification: ${verificationResult.verified ? 'PASSED' : 'FAILED'}]`;
            const explanationNote = `[Verification Notes: ${verificationResult.explanation}]`;
            const onChainNote = verificationResult.verifiedOnChain ?
              `[Payment Status: Auto-released]` : '';

            finalDeliverable += `${verificationNote}\n${explanationNote}\n${onChainNote}`;

            // Update the submission with the verification notes
            // This isn't strictly necessary, but helps with tracking
            try {
            } catch (updateError) {
              console.error('Error updating submission with verification notes:', updateError);
            }
          }
        }

        setVerifyingWork(false);
      }

      // Always note that evidence was provided
      if (evidenceImage) {
        finalDeliverable += `\n\n[Proof of work provided: ${evidenceImage.name}]`;
      }

      // Reset form state
      setSubmittingWork(false);
      setSelectedJob(null);

      // Add to submissions list (optimistic update)
      const newSubmission = {
        id: submissionId || Math.floor(Math.random() * 1000), // Use real ID if available
        jobId,
        jobTitle: applications.find(app => app.jobId === jobId)?.jobTitle || '',
        deliverable: finalDeliverable,
        hasEvidence: !!evidenceImage,
        aiVerified: verificationResult ? verificationResult.verified : null,
        paymentReleased: verificationResult ? verificationResult.verifiedOnChain : false,
        timestamp: Math.floor(Date.now() / 1000),
      };

      setSubmissions(prev => [...prev, newSubmission]);

      // Show appropriate success message
      if (verificationResult && verificationResult.verified && verificationResult.verifiedOnChain) {
        toast({
          title: 'Work Verified & Payment Released!',
          description: 'Your work was automatically verified by AI and payment has been released.',
          variant: 'default',
        });
      } else if (verificationResult && verificationResult.verified) {
        toast({
          title: 'Work Verified Successfully',
          description: 'Your work was automatically verified by AI but payment release is pending.',
          variant: 'default',
        });
      } else if (verificationResult && !verificationResult.verified) {
        toast({
          title: 'Work Submitted, Verification Failed',
          description: 'Your work was submitted but did not pass automatic verification.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Work Submitted Successfully',
          description: 'Your work has been submitted.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      setSubmittingWork(false);
      setVerifyingWork(false);
      toast({
        title: 'Error Submitting Work',
        description: 'There was an error submitting your work. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel job
  const handleCancelJob = async (jobId: number) => {
    if (!isConnected) return;

    try {
      // Call contract method to cancel job
      const hash = await cancelJob(jobId);

      // Update the job in the list (optimistic update)
      setPostedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, status: JobStatus.CANCELLED } : job
        )
      );

      // Show success message
      toast({
        title: 'Job Cancelled Successfully',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast({
        title: 'Error Cancelling Job',
        description: 'There was an error cancelling the job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Connect your wallet to view dashboard</h3>
        <p className="text-muted-foreground">You need to connect your wallet to access this feature</p>
      </div>
    );
  }

  if (loadingDashboard) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>

      <Tabs defaultValue="applications">
        <TabsList className="mb-6">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="posted-jobs">Posted Jobs</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          <div className="grid gap-6">
            {applications.length > 0 ? (
              applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                      <Badge variant={
                        app.status === ApplicationStatus.ACCEPTED ? "default" :
                          app.status === ApplicationStatus.REJECTED ? "destructive" :
                            "secondary"
                      }>
                        {app.status === ApplicationStatus.ACCEPTED ? "Accepted" :
                          app.status === ApplicationStatus.REJECTED ? "Rejected" :
                            "Pending"}
                      </Badge>
                    </div>
                    <CardDescription>Application ID: {app.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Your Proposal:</h4>
                      <p className="text-sm">{app.proposal}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Applied {new Date(app.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {app.status === ApplicationStatus.ACCEPTED && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedJob({ id: app.jobId, title: app.jobTitle })}>
                            Submit Work
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {app && (
                            <WorkSubmissionForm
                              jobTitle={app.jobTitle}
                              jobDescription="Job description will be loaded here" // This should ideally fetch from job details
                              isSubmitting={submittingWork || isWritePending}
                              isVerifying={verifyingWork}
                              onSubmit={async (deliverable, evidenceImage) => {
                                await handleSubmitWork(app.jobId, deliverable, evidenceImage);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">You haven't applied to any jobs yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="posted-jobs" className="space-y-6">
          <div className="grid gap-6">
            {postedJobs.length > 0 ? (
              postedJobs.map((job) => (
                <Card key={job.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge variant={
                        job.status === JobStatus.OPEN ? "default" :
                          job.status === JobStatus.COMPLETED ? "success" :
                            job.status === JobStatus.CANCELLED ? "destructive" :
                              job.status === JobStatus.AI_VERIFIED ? "default" :
                                "secondary"
                      }>
                        {job.status === JobStatus.OPEN ? "Open" :
                          job.status === JobStatus.ASSIGNED ? "Assigned" :
                            job.status === JobStatus.SUBMITTED ? "Submitted" :
                              job.status === JobStatus.AI_VERIFIED ? "AI Verified" :
                                job.status === JobStatus.COMPLETED ? "Completed" :
                                  "Cancelled"}
                      </Badge>
                    </div>
                    <CardDescription>Job ID: {job.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Description:</h4>
                      <p className="text-sm">{job.description}</p>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatEther(job.reward)} ETH</span>
                      <span>{calculateTimeLeft(job.deadline)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setViewingJobApplications({ id: job.id, title: job.title })}
                      >
                        View Applications
                      </Button>
                      {job.status === JobStatus.OPEN && (
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelJob(job.id)}
                          disabled={isWritePending}
                        >
                          {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Cancel Job
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">You haven't posted any jobs yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <div className="grid gap-6">
            {submissions.length > 0 ? (
              submissions.map((submission) => {
                // Extract verification note if it exists
                const verificationNote = submission.deliverable?.match(/\[Verification Notes: (.*?)\]/)?.[1] || '';

                return (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{submission.jobTitle}</CardTitle>
                        <VerificationStatus
                          aiVerified={submission.aiVerified}
                          paymentReleased={submission.paymentReleased}
                          hasEvidence={submission.hasEvidence}
                          verificationNote={verificationNote}
                        />
                      </div>
                      <CardDescription>Submission ID: {submission.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-1">Your Submission:</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {/* Strip out the verification notes from the displayed deliverable */}
                          {submission.deliverable?.replace(/\[AI Verification:.*?\]/g, '')
                            .replace(/\[Verification Notes:.*?\]/g, '')
                            .replace(/\[Payment Status:.*?\]/g, '')
                            .replace(/\[Proof of work provided:.*?\]/g, '')
                            .trim()}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Submitted on {new Date(submission.timestamp * 1000).toLocaleDateString()}
                      </div>

                      {/* Show proof indicator if provided */}
                      {submission.hasEvidence && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          Evidence image was provided for verification
                        </div>
                      )}

                      {/* Show AI verification result if available */}
                      {submission.aiVerified !== null && (
                        <div className={`mt-3 p-2 text-sm rounded-md ${submission.aiVerified
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                          }`}>
                          <div className="font-medium">
                            {submission.aiVerified
                              ? 'AI Verification Passed'
                              : 'AI Verification Failed'}
                          </div>
                          {verificationNote && (
                            <div className="mt-1">{verificationNote}</div>
                          )}

                          {submission.aiVerified && submission.paymentReleased && (
                            <div className="mt-2 py-1 px-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-300">
                              Payment was automatically released based on verification result
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">You haven't submitted any work yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Applications Dialog */}
      {viewingJobApplications && (
        <JobApplicationsView
          jobId={viewingJobApplications.id}
          jobTitle={viewingJobApplications.title}
          isOpen={!!viewingJobApplications}
          onClose={() => setViewingJobApplications(null)}
        />
      )}
    </div>
  );
}
