'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

export default function JobCreateForm() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID === 'mainnet' ? 'mainnet' : 'testnet';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !title || !description || !reward || !deadline) return;

    try {
      setIsSubmitting(true);
      // In a real app, we would call the contract method
      console.log('Creating job with:', {
        title,
        description,
        reward: parseEther(reward),
        deadline: Math.floor(new Date(deadline).getTime() / 1000),
      });

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reset form
      setTitle('');
      setDescription('');
      setReward('');
      setDeadline('');
      setIsSubmitting(false);

      // Show success message
      alert('Job created successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      setIsSubmitting(false);
    }
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward">Reward (ETH)</Label>
              <Input
                id="reward"
                type="number"
                placeholder="0.1"
                min="0.001"
                step="0.001"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
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
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !title || !description || !reward || !deadline}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Job
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>Job posted by: {address && address.substring(0, 6)}...{address && address.substring(address.length - 4)}</p>
        <p>Platform fee: 2%</p>
      </CardFooter>
    </Card>
  );
}
