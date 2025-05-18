'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatEther, formatAddress, calculateTimeLeft, JobStatus } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export default function JobListingComponent() {
  const { address, isConnected } = useAccount();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [proposal, setProposal] = useState('');
  const [applying, setApplying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the contract hooks
  const { jobs, loading, loadingProgress, fetchJobs } = useContractRead();
  const { applyForJob, isWritePending } = useContractWrite();

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId: number) => {
    if (!isConnected || !proposal.trim()) return;

    try {
      setApplying(true);
      // Call contract method to apply for job
      const hash = await applyForJob(jobId, proposal);
      if (typeof hash === 'string') {
        setTxHash(hash);
      }

      // Reset form and close dialog on success
      setApplying(false);
      setSelectedJob(null);
      setProposal('');

      // Show success message
      toast({
        title: "Application Submitted",
        description: typeof hash === 'string' ? `Your application has been submitted successfully. Transaction hash: ${hash}` : "Your application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      setApplying(false);
      toast({
        title: "Application Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const refreshJobs = () => {
    fetchJobs(true); // Force refresh
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Available Jobs</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{jobs.length} jobs found</Badge>
          <Button variant="outline" size="sm" onClick={refreshJobs} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-center mb-2">
            {jobs.length > 0
              ? `Found ${jobs.length} jobs, still scanning blockchain...`
              : 'Scanning blockchain for jobs...'}
          </span>
          <div className="text-sm text-muted-foreground max-w-md text-center">
            {loadingProgress || 'This may take a moment as we retrieve data from the blockchain'}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
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
                  <CardDescription>Posted by {formatAddress(job.poster)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="mb-4 text-sm line-clamp-3">{job.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatEther(job.reward)} ETH</span>
                    <span>{calculateTimeLeft(job.deadline)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedJob(job)}
                        className="w-full"
                        disabled={job.status !== JobStatus.OPEN}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      {selectedJob && (
                        <>
                          <DialogHeader>
                            <DialogTitle>{selectedJob.title}</DialogTitle>
                            <DialogDescription>
                              Posted by {formatAddress(selectedJob.poster)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-sm mb-4">{selectedJob.description}</p>
                            <div className="flex justify-between mb-4">
                              <div>
                                <h4 className="text-sm font-medium">Reward</h4>
                                <p className="text-sm">{formatEther(selectedJob.reward)} ETH</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Deadline</h4>
                                <p className="text-sm">{calculateTimeLeft(selectedJob.deadline)}</p>
                              </div>
                            </div>

                            {isConnected && selectedJob.status === JobStatus.OPEN && selectedJob.poster !== address && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Submit your proposal</h4>
                                <Textarea
                                  placeholder="Describe why you are the best candidate for this job..."
                                  value={proposal}
                                  onChange={(e) => setProposal(e.target.value)}
                                  className="mb-4"
                                  disabled={applying || isWritePending}
                                />
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            {isConnected && selectedJob.status === JobStatus.OPEN && selectedJob.poster !== address ? (
                              <Button
                                onClick={() => handleApply(selectedJob.id)}
                                disabled={applying || !proposal.trim() || isWritePending}
                              >
                                {(applying || isWritePending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Apply for this Job
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => setSelectedJob(null)}
                              >
                                Close
                              </Button>
                            )}
                          </DialogFooter>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          {jobs.length === 0 && !loading && (
            <div className="text-center py-12 border rounded-md">
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="text-muted-foreground">There are no jobs available right now. Be the first to post a job!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
