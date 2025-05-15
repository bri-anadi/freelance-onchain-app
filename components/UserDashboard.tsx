'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatEther, formatAddress, calculateTimeLeft, JobStatus, ApplicationStatus } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Job = {
  id: number;
  title: string;
  description: string;
  reward: bigint;
  deadline: number;
  status: number;
};

type Application = {
  id: number;
  jobId: number;
  jobTitle: string;
  proposal: string;
  status: number;
  timestamp: number;
};

type Submission = {
  id: number;
  jobId: number;
  jobTitle: string;
  deliverable: string;
  aiVerified: boolean;
  posterApproved: boolean;
  timestamp: number;
};

export default function UserDashboard() {
  const { address, isConnected } = useAccount();
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [deliverable, setDeliverable] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected) return;

      try {
        setLoading(true);
        // In a real app, we would fetch data from the blockchain
        // For demo purposes, we'll simulate with mock data

        setTimeout(() => {
          // Mock posted jobs
          setPostedJobs([
            {
              id: 3,
              title: 'Develop Solidity Smart Contract',
              description: 'Need a developer to write a custom smart contract for a DAO.',
              reward: BigInt('2000000000000000000'), // 2 ETH
              deadline: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
              status: JobStatus.OPEN,
            },
          ]);

          // Mock applications
          setApplications([
            {
              id: 1,
              jobId: 1,
              jobTitle: 'Build a DeFi Dashboard',
              proposal: 'I have 3 years of experience building DeFi interfaces and can deliver this dashboard in 5 days.',
              status: ApplicationStatus.PENDING,
              timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
            },
            {
              id: 2,
              jobId: 2,
              jobTitle: 'Design NFT Collection',
              proposal: 'I am a professional designer specializing in NFT art and can create a unique collection for your project.',
              status: ApplicationStatus.ACCEPTED,
              timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
            },
          ]);

          // Mock submissions
          setSubmissions([
            {
              id: 1,
              jobId: 2,
              jobTitle: 'Design NFT Collection',
              deliverable: 'I have completed the 10 NFT designs as requested. You can view them at https://example.com/nft-designs',
              aiVerified: true,
              posterApproved: false,
              timestamp: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
            },
          ]);

          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isConnected]);

  const handleSubmitWork = async (jobId: number) => {
    if (!isConnected || !deliverable.trim()) return;

    try {
      setSubmittingWork(true);
      // In a real app, we would call the contract method
      console.log(`Submitting work for job ${jobId}: ${deliverable}`);

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update the UI
      setSubmittingWork(false);
      setSelectedJob(null);
      setDeliverable('');

      // Add the new submission to the list
      const newSubmission: Submission = {
        id: Math.floor(Math.random() * 1000),
        jobId,
        jobTitle: applications.find(app => app.jobId === jobId)?.jobTitle || '',
        deliverable,
        aiVerified: false,
        posterApproved: false,
        timestamp: Math.floor(Date.now() / 1000),
      };

      setSubmissions(prev => [...prev, newSubmission]);

      // Show success message
      alert('Work submitted successfully!');
    } catch (error) {
      console.error('Error submitting work:', error);
      setSubmittingWork(false);
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

  if (loading) {
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
                          <Button onClick={() => setSelectedJob({ id: app.jobId, title: app.jobTitle } as Job)}>
                            Submit Work
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Work for {app.jobTitle}</DialogTitle>
                            <DialogDescription>
                              Describe the work you've completed and provide any relevant links or information.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Describe your completed work and include any relevant links..."
                              value={deliverable}
                              onChange={(e) => setDeliverable(e.target.value)}
                              className="min-h-[150px]"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleSubmitWork(app.jobId)}
                              disabled={submittingWork || !deliverable.trim()}
                            >
                              {submittingWork && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit Work
                            </Button>
                          </DialogFooter>
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
                        job.status === JobStatus.COMPLETED ? "outline" :
                        job.status === JobStatus.CANCELLED ? "destructive" :
                        "secondary"
                      }>
                        {job.status === JobStatus.OPEN ? "Open" :
                         job.status === JobStatus.ASSIGNED ? "Assigned" :
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
                        <Button variant="destructive">Cancel Job</Button>
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
                        <Badge variant={submission.posterApproved ? "default" : "secondary"}>
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
