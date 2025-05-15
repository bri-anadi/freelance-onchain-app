'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatEther, formatAddress, calculateTimeLeft, JobStatus } from '@/lib/utils';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { Loader2 } from 'lucide-react';

type Job = {
  id: number;
  poster: string;
  title: string;
  description: string;
  reward: bigint;
  deadline: number;
  status: number;
  assignedFreelancer: string;
};

export default function JobListingComponent() {
  const { address, isConnected } = useAccount();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proposal, setProposal] = useState('');
  const [applying, setApplying] = useState(false);

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID === 'mainnet' ? 'mainnet' : 'testnet';

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // In a real app, we would query jobs from the blockchain or an indexer
        // For demo purposes, we'll simulate with a delay
        setTimeout(() => {
          setJobs([
            {
              id: 1,
              poster: '0x123456789abcdef123456789abcdef123456789a',
              title: 'Build a DeFi Dashboard',
              description: 'Looking for a developer to build a dashboard for DeFi protocols on Base.',
              reward: BigInt('1000000000000000000'), // 1 ETH
              deadline: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
              status: JobStatus.OPEN,
              assignedFreelancer: '0x0000000000000000000000000000000000000000',
            },
            {
              id: 2,
              poster: '0x987654321fedcba987654321fedcba987654321',
              title: 'Design NFT Collection',
              description: 'Need a designer to create a collection of 10 NFTs for a new project.',
              reward: BigInt('500000000000000000'), // 0.5 ETH
              deadline: Math.floor(Date.now() / 1000) + 1209600, // 2 weeks from now
              status: JobStatus.OPEN,
              assignedFreelancer: '0x0000000000000000000000000000000000000000',
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = async (jobId: number) => {
    if (!isConnected || !proposal.trim()) return;

    try {
      setApplying(true);
      // In a real app, we would call the contract method
      console.log(`Applying for job ${jobId} with proposal: ${proposal}`);

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setApplying(false);
      setSelectedJob(null);
      setProposal('');
      // Show success message
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Available Jobs</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{jobs.length} jobs found</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <Badge variant={job.status === JobStatus.OPEN ? "default" : "secondary"}>
                  {job.status === JobStatus.OPEN ? "Open" : "Assigned"}
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
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        {isConnected && selectedJob.status === JobStatus.OPEN && selectedJob.poster !== address ? (
                          <Button
                            onClick={() => handleApply(selectedJob.id)}
                            disabled={applying || !proposal.trim()}
                          >
                            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No jobs found</h3>
          <p className="text-muted-foreground">Check back later for new opportunities</p>
        </div>
      )}
    </div>
  );
}
