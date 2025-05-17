'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatAddress } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { publicClient } from '@/lib/client';
import { parseAbiItem } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/contract';
import SubmissionVerifier from '@/components/SubmissionVerifier';

export default function AdminPanel() {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [platformFee, setPlatformFee] = useState(0);
  const [aiReleaseBps, setAiReleaseBps] = useState(0);
  const [newFee, setNewFee] = useState('');
  const [newReleaseBps, setNewReleaseBps] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    today: 0,
    total: 0,
    successRate: 0
  });
  const { toast } = useToast();

  // Use contract hooks
  const {
    isContractOwner,
    getPlatformFee,
    getAIVerificationReleaseBps,
    getJob,
    getSubmission
  } = useContractRead();

  const {
    verifyWorkByAI,
    updatePlatformFee,
    updateAIVerificationReleaseBps,
    isWritePending
  } = useContractWrite();

  const getContractAddress = () => {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
    return chainId === 'mainnet' ? CONTRACT_ADDRESS.mainnet : CONTRACT_ADDRESS.testnet;
  };

  // Check if user is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!isConnected) {
        setIsOwner(false);
        setLoadingOwner(false);
        return;
      }

      try {
        setLoadingOwner(true);
        const owner = await isContractOwner();
        setIsOwner(owner);

        console.log("Real owner check result:", owner);
        console.log("Your address:", address);

        // Get platform settings
        const fee = await getPlatformFee();
        const releaseBps = await getAIVerificationReleaseBps();

        setPlatformFee(fee);
        setAiReleaseBps(releaseBps);
        setLoadingOwner(false);
      } catch (error) {
        console.error('Error checking owner:', error);
        setIsOwner(false);
        setLoadingOwner(false);
      }
    };

    checkOwner();
  }, [isConnected]);

  // Fetch pending submissions and stats
  useEffect(() => {
    const fetchSubmissionsAndStats = async () => {
      if (!isOwner) return;

      try {
        setLoadingSubmissions(true);

        // Fetch all WorkSubmitted events
        const submissionEvents = await publicClient.getLogs({
          address: getContractAddress() as `0x${string}`,
          event: parseAbiItem('event WorkSubmitted(uint256 indexed submissionId, uint256 indexed jobId, address indexed freelancer)'),
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        // Fetch all WorkVerifiedByAI events to calculate stats
        const verificationEvents = await publicClient.getLogs({
          address: getContractAddress() as `0x${string}`,
          event: parseAbiItem('event WorkVerifiedByAI(uint256 indexed submissionId, uint256 indexed jobId, address indexed freelancer)'),
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        const pendingSubmissions = [];
        let totalSubmissions = submissionEvents.length;
        let verifiedToday = 0;
        let totalVerified = verificationEvents.length;

        // Calculate today's verifications
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Math.floor(today.getTime() / 1000);

        for (const event of verificationEvents) {
          if (event.blockNumber) {
            const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
            if (Number(block.timestamp) > todayTimestamp) {
              verifiedToday++;
            }
          }
        }

        // Map of submissions that have been verified (by ID)
        const verifiedSubmissions = new Map();
        for (const event of verificationEvents) {
          if (event.args && event.args.submissionId) {
            verifiedSubmissions.set(Number(event.args.submissionId), true);
          }
        }

        // Get pending submissions (not verified by AI)
        for (const event of submissionEvents) {
          if (event.args && event.args.submissionId !== undefined) {
            const submissionId = Number(event.args.submissionId);

            // Skip if already verified
            if (verifiedSubmissions.has(submissionId)) {
              continue;
            }

            try {
              const submission = await getSubmission(submissionId);

              if (submission && !submission.aiVerified) {
                const jobId = Number(event.args.jobId);
                const job = await getJob(jobId);

                pendingSubmissions.push({
                  id: submissionId,
                  jobId,
                  job: {
                    title: job ? job.title : `Job #${jobId}`,
                    poster: job ? job.poster : '',
                  },
                  freelancer: submission.freelancer,
                  deliverable: submission.deliverable,
                  aiVerified: submission.aiVerified,
                  posterApproved: submission.posterApproved,
                  timestamp: submission.timestamp,
                });
              }
            } catch (error) {
              console.error(`Error fetching submission details for ID ${submissionId}:`, error);
            }
          }
        }

        // Calculate success rate
        const successRate = totalSubmissions > 0 ? (totalVerified / totalSubmissions) * 100 : 0;

        setSubmissions(pendingSubmissions);
        setVerificationStats({
          pending: pendingSubmissions.length,
          today: verifiedToday,
          total: totalVerified,
          successRate: Math.round(successRate)
        });

        setLoadingSubmissions(false);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissionsAndStats();
  }, [isOwner]);

  // Handle AI verification
  const handleVerification = async (submissionId: number, verified: boolean, aiExplanation?: string) => {
    if (!isConnected || !isOwner) return;

    try {
      // Log the AI explanation for troubleshooting if needed
      if (aiExplanation) {
        console.log(`AI verification for submission #${submissionId}: ${verified ? 'Verified' : 'Rejected'}`);
        console.log(`Explanation: ${aiExplanation}`);
      }

      // Call contract method to verify work
      const hash = await verifyWorkByAI(submissionId, verified);

      // Update submissions list (optimistic update)
      setSubmissions(prev =>
        prev.filter(sub => sub.id !== submissionId)
      );

      setSelectedSubmission(null);

      // Show success message
      toast({
        title: verified ? 'Work Verified Successfully' : 'Work Rejected',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });

      // Update stats
      setVerificationStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        today: prev.today + 1,
        total: prev.total + 1,
      }));
    } catch (error) {
      console.error('Error verifying work:', error);
      toast({
        title: 'Error Verifying Work',
        description: 'There was an error processing this verification. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle platform fee update
  const handleUpdateFee = async () => {
    if (!isConnected || !isOwner || !newFee) return;

    try {
      // Convert percentage to basis points (e.g., 2.5% -> 250 bps)
      const feeBps = Math.round(parseFloat(newFee) * 100);

      if (feeBps > 1000) {
        toast({
          title: 'Invalid Fee',
          description: 'Platform fee cannot exceed 10%',
          variant: 'destructive',
        });
        return;
      }

      // Call contract method to update fee
      const hash = await updatePlatformFee(feeBps);

      // Update state
      setPlatformFee(parseFloat(newFee));
      setNewFee('');

      // Show success message
      toast({
        title: 'Platform Fee Updated',
        description: `New fee: ${newFee}%${typeof hash === 'string' ? `. Transaction hash: ${hash}` : ''}`,
      });
    } catch (error) {
      console.error('Error updating platform fee:', error);
      toast({
        title: 'Error Updating Fee',
        description: 'There was an error updating the platform fee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle AI verification release percentage update
  const handleUpdateReleaseBps = async () => {
    if (!isConnected || !isOwner || !newReleaseBps) return;

    try {
      // Convert percentage to basis points (e.g., 70% -> 7000 bps)
      const releaseBps = Math.round(parseFloat(newReleaseBps) * 100);

      if (releaseBps > 8000) {
        toast({
          title: 'Invalid Percentage',
          description: 'Release percentage cannot exceed 80%',
          variant: 'destructive',
        });
        return;
      }

      // Call contract method to update release percentage
      const hash = await updateAIVerificationReleaseBps(releaseBps);

      // Update state
      setAiReleaseBps(parseFloat(newReleaseBps));
      setNewReleaseBps('');

      // Show success message
      toast({
        title: 'Release Percentage Updated',
        description: `New percentage: ${newReleaseBps}%${typeof hash === 'string' ? `. Transaction hash: ${hash}` : ''}`,
      });
    } catch (error) {
      console.error('Error updating release percentage:', error);
      toast({
        title: 'Error Updating Percentage',
        description: 'There was an error updating the release percentage. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loadingOwner) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking admin access...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Connect your wallet to access admin panel</h3>
        <p className="text-muted-foreground">You need to connect your wallet to access this feature</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
        <p className="text-muted-foreground">You do not have permission to access the admin panel</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Manage platform fees and payout percentages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Current Platform Fee:</span>
                  <span>{platformFee}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="New fee (%)"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    min="0"
                    max="10"
                    step="0.1"
                    disabled={isWritePending}
                  />
                  <Button
                    onClick={handleUpdateFee}
                    disabled={isWritePending || !newFee}
                  >
                    {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Max fee: 10%</p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">AI Verification Release:</span>
                  <span>{aiReleaseBps}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="New percentage (%)"
                    value={newReleaseBps}
                    onChange={(e) => setNewReleaseBps(e.target.value)}
                    min="0"
                    max="80"
                    step="1"
                    disabled={isWritePending}
                  />
                  <Button
                    onClick={handleUpdateReleaseBps}
                    disabled={isWritePending || !newReleaseBps}
                  >
                    {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Max release: 80%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Verification Stats</CardTitle>
            <CardDescription>Overview of verification activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Pending Verifications</h3>
                <p className="text-2xl font-bold">{verificationStats.pending}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Verified Today</h3>
                <p className="text-2xl font-bold">{verificationStats.today}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Total Verified</h3>
                <p className="text-2xl font-bold">{verificationStats.total}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Success Rate</h3>
                <p className="text-2xl font-bold">{verificationStats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mb-4">Pending Verifications</h3>

      {loadingSubmissions ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading submissions...</span>
        </div>
      ) : (
        <>
          {submissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.id}</TableCell>
                      <TableCell>{submission.job.title}</TableCell>
                      <TableCell>{formatAddress(submission.freelancer)}</TableCell>
                      <TableCell>{new Date(submission.timestamp * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {submission.aiVerified ? (
                          <Badge variant="default" className="bg-green-500">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                              disabled={submission.aiVerified}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            {selectedSubmission && (
                              <>
                                <DialogHeader>
                                  <DialogTitle>Verify Work Submission</DialogTitle>
                                  <DialogDescription>
                                    Review the submission and verify if it meets the requirements.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-1">Job:</h4>
                                    <p className="text-sm">{selectedSubmission.job.title}</p>
                                  </div>
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-1">Freelancer:</h4>
                                    <p className="text-sm">{formatAddress(selectedSubmission.freelancer)}</p>
                                  </div>

                                  <SubmissionVerifier
                                    jobTitle={selectedSubmission.job.title}
                                    jobDescription={selectedSubmission.job.description || "No description provided"}
                                    deliverable={selectedSubmission.deliverable}
                                    isProcessing={isWritePending}
                                    onVerify={(verified, aiExplanation) => {
                                      handleVerification(selectedSubmission.id, verified, aiExplanation);
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <h3 className="text-lg font-medium mb-2">No pending verifications</h3>
              <p className="text-muted-foreground">There are no submissions waiting for AI verification</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
