'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatEther, formatAddress, JobStatus } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPanel() {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [platformFee, setPlatformFee] = useState(2.5);
  const [aiReleaseBps, setAiReleaseBps] = useState(70);
  const [newFee, setNewFee] = useState('');
  const [newReleaseBps, setNewReleaseBps] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const { toast } = useToast();

  // Use contract hooks
  const {
    isContractOwner,
    getPlatformFee,
    getAIVerificationReleaseBps
  } = useContractRead();

  const {
    verifyWorkByAI,
    updatePlatformFee,
    updateAIVerificationReleaseBps,
    isWritePending
  } = useContractWrite();

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

  // Fetch pending submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!isOwner) return;

      try {
        setLoadingSubmissions(true);

        // In a real app, this would query all submissions with status SUBMITTED
        // For this demo, we're simulating with mock data
        setTimeout(() => {
          const mockSubmissions = [
            {
              id: 1,
              jobId: 2,
              job: {
                title: 'Design NFT Collection',
                poster: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4',
              },
              freelancer: '0x1234567890abcdef1234567890abcdef12345678',
              deliverable: 'I have completed the 10 NFT designs as requested. You can view them at https://example.com/nft-designs',
              aiVerified: false,
              posterApproved: false,
              timestamp: Math.floor(Date.now() / 1000) - 86400,
            },
            {
              id: 2,
              jobId: 3,
              job: {
                title: 'Develop API Integration',
                poster: '0xb2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f',
              },
              freelancer: '0x2345678901abcdef2345678901abcdef23456789',
              deliverable: 'API integration is complete. Documentation and code are available at https://github.com/username/api-integration',
              aiVerified: false,
              posterApproved: false,
              timestamp: Math.floor(Date.now() / 1000) - 172800,
            },
          ];

          setSubmissions(mockSubmissions);
          setLoadingSubmissions(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [isOwner]);

  // Handle AI verification
  const handleVerification = async (submissionId: number, verified: boolean) => {
    if (!isConnected || !isOwner) return;

    try {
      // Call contract method to verify work
      const hash = await verifyWorkByAI(submissionId, verified);

      // Update submissions list (optimistic update)
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, aiVerified: verified } : sub
        )
      );

      setSelectedSubmission(null);

      // Show success message
      toast({
        title: verified ? 'Work Verified Successfully' : 'Work Rejected',
        description: typeof hash === 'string' ? `Transaction hash: ${hash}` : 'Transaction submitted',
      });
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
                <p className="text-2xl font-bold">{submissions.filter(s => !s.aiVerified).length}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Verified Today</h3>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Total Verified</h3>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Success Rate</h3>
                <p className="text-2xl font-bold">94%</p>
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
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-1">Deliverable:</h4>
                                    <div className="p-3 bg-muted rounded-md text-sm">
                                      {selectedSubmission.deliverable}
                                    </div>
                                  </div>
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-1">Submitted:</h4>
                                    <p className="text-sm">{new Date(selectedSubmission.timestamp * 1000).toLocaleString()}</p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <div className="flex space-x-2 w-full">
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleVerification(selectedSubmission.id, false)}
                                      disabled={isWritePending}
                                      className="flex-1"
                                    >
                                      {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </Button>
                                    <Button
                                      variant="default"
                                      onClick={() => handleVerification(selectedSubmission.id, true)}
                                      disabled={isWritePending}
                                      className="flex-1"
                                    >
                                      {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Verify
                                    </Button>
                                  </div>
                                </DialogFooter>
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
              <p className="text-muted-foreground">No pending verifications</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
