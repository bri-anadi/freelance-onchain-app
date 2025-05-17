'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatEther, calculateTimeLeft, JobStatus, ApplicationStatus } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import WorkSubmissionForm from '@/components/WorkSubmissionForm';

export default function UserDashboard() {
  const { address, isConnected } = useAccount();
  const [setSelectedJob] = useState<any | null>(null);
  const [deliverable, setDeliverable] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  // Use contract hooks
  const {
    loading,
    getUserApplications,
    getUserPostedJobs,
    getUserSubmissions
  } = useContractRead();

  const {
    submitWork,
    approveWork,
    cancelJob,
    acceptApplication,
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

  // Handle submit work
  const handleSubmitWork = async (jobId: number, deliverableText: string, evidenceImage: File | null) => {
    if (!isConnected || !deliverableText.trim()) return;

    try {
      setSubmittingWork(true);

      // Format the deliverable - include note about evidence if provided
      let finalDeliverable = deliverableText;
      if (evidenceImage) {
        // Include a note in the deliverable about the evidence image
        // This is just for information purposes since we're not storing the image
        finalDeliverable += `\n\n[Proof of work provided: ${evidenceImage.name}]`;

        // Log for demonstration purposes
        console.log(`Evidence image would be processed: ${evidenceImage.name}`);
        console.log(`File size: ${Math.round(evidenceImage.size / 1024)} KB`);
      }

      // Call contract method to submit work
      const hash = await submitWork(jobId, finalDeliverable);

      if (typeof hash === 'string') {
        setTxHash(hash);
      }

      // Reset form and close dialog
      setSubmittingWork(false);
      setSelectedJob(null);

      // Add the new submission to the list (optimistic update)
      const newSubmission = {
        id: Math.floor(Math.random() * 1000), // Temporary ID until we refresh
        jobId,
        jobTitle: applications.find(app => app.jobId === jobId)?.jobTitle || '',
        deliverable: finalDeliverable,
        hasEvidence: !!evidenceImage,
        aiVerified: false,
        posterApproved: false,
        timestamp: Math.floor(Date.now() / 1000),
      };

      setSubmissions(prev => [...prev, newSubmission]);

      // Show success message
      toast({
        title: 'Work Submitted Successfully',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });
    } catch (error) {
      console.error('Error submitting work:', error);
      setSubmittingWork(false);
      toast({
        title: 'Error Submitting Work',
        description: 'There was an error submitting your work. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle approve work
  const handleApproveWork = async (submissionId: number) => {
    if (!isConnected) return;

    try {
      // Call contract method to approve work
      const hash = await approveWork(submissionId);

      // Update the submission in the list (optimistic update)
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, posterApproved: true } : sub
        )
      );

      // Show success message
      toast({
        title: 'Work Approved Successfully',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });
    } catch (error) {
      console.error('Error approving work:', error);
      toast({
        title: 'Error Approving Work',
        description: 'There was an error approving the work. Please try again.',
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

  // Handle accept application
  const handleAcceptApplication = async (applicationId: number) => {
    if (!isConnected) return;

    try {
      // Call contract method to accept application
      const hash = await acceptApplication(applicationId);

      // Update the application in the list (optimistic update)
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: ApplicationStatus.ACCEPTED } : app
        )
      );

      // Show success message
      toast({
        title: 'Application Accepted Successfully',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });
    } catch (error) {
      console.error('Error accepting application:', error);
      toast({
        title: 'Error Accepting Application',
        description: 'There was an error accepting the application. Please try again.',
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
                        <Button>Submit Work</Button>
                      </DialogTrigger>
                      <DialogContent>
                        {app && (
                          <WorkSubmissionForm
                            jobTitle={app.jobTitle}
                            isSubmitting={submittingWork || isWritePending}
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
                <Card key={job.id}>
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
                  <CardContent>
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
                      <Button variant="outline">View Applications</Button>
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
              submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{submission.jobTitle}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge variant={submission.aiVerified ? "default" : "secondary"}>
                          {submission.aiVerified ? "AI Verified" : "Pending AI Verification"}
                        </Badge>
                        <Badge variant={submission.posterApproved ? "success" : "secondary"}>
                          {submission.posterApproved ? "Approved" : "Pending Approval"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>Submission ID: {submission.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Your Submission:</h4>
                      <p className="text-sm">{submission.deliverable}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted on {new Date(submission.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </CardContent>
                  {address === submission.poster && !submission.posterApproved && (
                    <CardFooter>
                      <Button
                        onClick={() => handleApproveWork(submission.id)}
                        disabled={isWritePending}
                      >
                        {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve Work
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">You haven't submitted any work yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
