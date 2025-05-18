'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useContractWrite, useContractRead } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';

export default function JobCreateForm() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txSubmitted, setTxSubmitted] = useState(false);
  const { toast } = useToast();

  // Use the contract hooks
  const { getPlatformFee } = useContractRead();
  const { createJob, isWritePending } = useContractWrite();
  const [platformFee, setPlatformFee] = useState<number | null>(null);

  // Fetch platform fee on component mount
  useEffect(() => {  // Changed from useState to useEffect
    const fetchPlatformFee = async () => {
      try {
        const fee = await getPlatformFee();
        setPlatformFee(fee);
      } catch (error) {
        console.error('Error fetching platform fee:', error);
        setPlatformFee(2.5); // Default value if fetch fails
      }
    };

    fetchPlatformFee();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !title || !description || !reward || !deadline) return;

    try {
      setTxSubmitted(true);

      // Convert deadline to unix timestamp
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      // Call contract method to create a job
      const hash = await createJob(title, description, deadlineTimestamp, reward);

      // Only set hash if it's a string
      if (typeof hash === 'string') {
        setTxHash(hash);
      }

      // Show success message
      toast({
        title: 'Job Creation Submitted',
        description: `Your job is being created on the blockchain. ${typeof hash === 'string' ? `Transaction hash: ${hash}` : ''}`,
      });

      // Wait a moment to show the success state
      setTimeout(() => {
        // Reset form
        setTitle('');
        setDescription('');
        setReward('');
        setDeadline('');
        setTxSubmitted(false);

        // Show final success message
        toast({
          title: 'Job Created Successfully',
          description: 'Your job has been posted to the blockchain and is now available for freelancers.',
          variant: 'default',
        });
      }, 2000);
    } catch (error) {
      console.error('Error creating job:', error);
      setTxSubmitted(false);

      // Show error message
      toast({
        title: 'Error Creating Job',
        description: 'There was an error creating your job. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate transaction fee
  const calculateTotalCost = () => {
    if (!reward || parseFloat(reward) <= 0) return '0';
    const rewardValue = parseFloat(reward);
    const feePercentage = platformFee !== null ? platformFee : 2.5;
    const fee = (rewardValue * feePercentage) / 100;
    return (rewardValue + fee).toFixed(6);
  };

  // Calculate minimum date for deadline (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Connect your wallet to post a job</h3>
        <p className="text-muted-foreground">You need to connect your wallet to access this feature</p>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
        <CardDescription>
          Fill out the form below to post a new job on the platform.
          Funds will be locked in the contract until work is approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g., Build a DeFi Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isWritePending || txSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed requirements for the job..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px]"
              required
              disabled={isWritePending || txSubmitted}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward">Reward (ETH)</Label>
              <Input
                id="reward"
                type="number"
                placeholder="0.1"
                min="0.0001"
                step="0.0001"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
                disabled={isWritePending || txSubmitted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                min={minDate}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={isWritePending || txSubmitted}
              />
            </div>
          </div>

          {/* Fee and total cost information */}
          {reward && parseFloat(reward) > 0 && (
            <div className="text-sm border rounded-md p-4 bg-muted/50">
              <div className="flex justify-between mb-2">
                <span>Job Reward:</span>
                <span className="font-medium">{reward} ETH</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Platform Fee ({platformFee !== null ? platformFee : 2.5}%):</span>
                <span className="font-medium">{((parseFloat(reward) * (platformFee !== null ? platformFee : 2.5)) / 100).toFixed(6)} ETH</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span>{calculateTotalCost()} ETH</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isWritePending || txSubmitted || !title || !description || !reward || !deadline}
          >
            {(isWritePending || txSubmitted) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {txSubmitted ? 'Creating Job...' : 'Post Job'}
          </Button>

          {txHash && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
              <p className="text-green-700 dark:text-green-300 text-sm font-medium">Job creation transaction submitted!</p>
              <p className="text-xs text-green-600 dark:text-green-400 break-all mt-1">
                Transaction hash: {txHash}
              </p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>Job posted by: {address && address.substring(0, 6)}...{address && address.substring(address.length - 4)}</p>
        <p>Platform fee: {platformFee !== null ? platformFee : 2.5}%</p>
      </CardFooter>
    </Card>
  );
}
