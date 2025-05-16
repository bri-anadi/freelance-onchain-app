'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, parseAbiItem } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { JobStatus, ApplicationStatus } from '@/lib/utils';
import { publicClient } from '@/lib/client';

// Determine the chain based on environment
const getContractAddress = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId === 'mainnet' ? CONTRACT_ADDRESS.mainnet : CONTRACT_ADDRESS.testnet;
};

export function useContractRead() {
  const { address, isConnected } = useAccount();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all jobs
  const fetchJobs = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);

      // Fetch JobCreated events to get all job IDs
      const jobEvents = await publicClient.getLogs({
        address: getContractAddress(),
        event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed poster, uint256 reward)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const fetchedJobs = [];

      for (const event of jobEvents) {
        if (event.args && event.args.jobId !== undefined) {
          try {
            const jobId = Number(event.args.jobId);
            const jobDetails = await publicClient.readContract({
              address: getContractAddress(),
              abi: CONTRACT_ABI,
              functionName: 'getJobDetails',
              args: [jobId],
            });

            if (jobDetails) {
              const [poster, title, description, reward, deadline, status, assignedFreelancer] = jobDetails as [string, string, string, bigint, bigint, number, string];
              fetchedJobs.push({
                id: jobId,
                poster,
                title,
                description,
                reward,
                deadline: Number(deadline),
                status,
                assignedFreelancer
              });
            }
          } catch (error) {
            console.error(`Error fetching job details for job ID ${event.args.jobId}:`, error);
          }
        }
      }

      setJobs(fetchedJobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
      setJobs([]);
    }
  };

  // Get job by ID
  const getJob = async (jobId: number) => {
    try {
      const result = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'getJobDetails',
        args: [jobId],
      });

      if (result) {
        const [poster, title, description, reward, deadline, status, assignedFreelancer] = result as [string, string, string, bigint, bigint, number, string];
        return {
          id: jobId,
          poster,
          title,
          description,
          reward,
          deadline: Number(deadline),
          status,
          assignedFreelancer
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting job details:', error);
      throw error;
    }
  };

  // Get job applications
  const getJobApplications = async (jobId: number) => {
    try {
      const applicationIds = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'getJobApplications',
        args: [jobId],
      }) as bigint[];

      const applications = [];
      for (const appId of applicationIds) {
        const application = await publicClient.readContract({
          address: getContractAddress(),
          abi: CONTRACT_ABI,
          functionName: 'applications',
          args: [appId],
        });

        if (application) {
          // Extract data and convert types appropriately
          const [id, jobId, freelancer, proposal, status, timestamp] = application as [bigint, bigint, string, string, number, bigint];
          applications.push({
            id: Number(id),
            jobId: Number(jobId),
            freelancer,
            proposal,
            status,
            timestamp: Number(timestamp)
          });
        }
      }
      return applications;
    } catch (error) {
      console.error('Error getting job applications:', error);
      return [];
    }
  };

  // Get submission by ID
  const getSubmission = async (submissionId: number) => {
    try {
      const result = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'getSubmissionDetails',
        args: [submissionId],
      });

      if (result) {
        const [jobId, freelancer, deliverable, aiVerified, posterApproved, timestamp] = result as [bigint, string, string, boolean, boolean, bigint];
        return {
          id: submissionId,
          jobId: Number(jobId),
          freelancer,
          deliverable,
          aiVerified,
          posterApproved,
          timestamp: Number(timestamp)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting submission details:', error);
      return null;
    }
  };

  // Get job submission by job ID
  const getJobSubmission = async (jobId: number) => {
    try {
      const submissionId = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'jobToSubmission',
        args: [jobId],
      }) as bigint;

      if (submissionId && submissionId > BigInt(0)) {
        return getSubmission(Number(submissionId));
      }
      return null;
    } catch (error) {
      console.error('Error getting job submission:', error);
      return null;
    }
  };

  // Get user submitted applications
  const getUserApplications = async (userAddress: string) => {
    try {
      // Mencari events ApplicationSubmitted yang difilter berdasarkan alamat freelancer
      const applicationEvents = await publicClient.getLogs({
        address: getContractAddress(),
        event: parseAbiItem('event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed jobId, address indexed freelancer)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
        args: {
          freelancer: userAddress as `0x${string}`
        }
      });

      const applications = [];

      for (const event of applicationEvents) {
        if (event.args && event.args.applicationId !== undefined) {
          try {
            const applicationId = Number(event.args.applicationId);
            const application = await publicClient.readContract({
              address: getContractAddress(),
              abi: CONTRACT_ABI,
              functionName: 'applications',
              args: [applicationId],
            });

            if (application) {
              const [id, jobId, freelancer, proposal, status, timestamp] = application as [bigint, bigint, string, string, number, bigint];

              // Mendapatkan judul pekerjaan
              const job = await getJob(Number(jobId));

              applications.push({
                id: Number(id),
                jobId: Number(jobId),
                jobTitle: job ? job.title : `Job #${jobId}`,
                proposal,
                status,
                timestamp: Number(timestamp)
              });
            }
          } catch (error) {
            console.error(`Error fetching application details for ID ${event.args.applicationId}:`, error);
          }
        }
      }

      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      return [];
    }
  };

  // Get user posted jobs
  const getUserPostedJobs = async (userAddress: string) => {
    try {
      // Mencari events JobCreated yang difilter berdasarkan alamat poster
      const jobEvents = await publicClient.getLogs({
        address: getContractAddress(),
        event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed poster, uint256 reward)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
        args: {
          poster: userAddress as `0x${string}`
        }
      });

      const postedJobs = [];

      for (const event of jobEvents) {
        if (event.args && event.args.jobId !== undefined) {
          try {
            const jobId = Number(event.args.jobId);
            const job = await getJob(jobId);
            if (job) {
              postedJobs.push(job);
            }
          } catch (error) {
            console.error(`Error fetching job details for ID ${event.args.jobId}:`, error);
          }
        }
      }

      return postedJobs;
    } catch (error) {
      console.error('Error getting user posted jobs:', error);
      return [];
    }
  };

  // Get user submissions
  const getUserSubmissions = async (userAddress: string) => {
    try {
      // Mencari events WorkSubmitted yang difilter berdasarkan alamat freelancer
      const submissionEvents = await publicClient.getLogs({
        address: getContractAddress(),
        event: parseAbiItem('event WorkSubmitted(uint256 indexed submissionId, uint256 indexed jobId, address indexed freelancer)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
        args: {
          freelancer: userAddress as `0x${string}`
        }
      });

      const submissions = [];

      for (const event of submissionEvents) {
        if (event.args && event.args.submissionId !== undefined) {
          try {
            const submissionId = Number(event.args.submissionId);
            const submission = await getSubmission(submissionId);

            if (submission) {
              // Mendapatkan judul pekerjaan
              const job = await getJob(Number(submission.jobId));

              submissions.push({
                ...submission,
                jobTitle: job ? job.title : `Job #${submission.jobId}`
              });
            }
          } catch (error) {
            console.error(`Error fetching submission details for ID ${event.args.submissionId}:`, error);
          }
        }
      }

      return submissions;
    } catch (error) {
      console.error('Error getting user submissions:', error);
      return [];
    }
  };

  // Check if user is contract owner
  const isContractOwner = async () => {
    try {
      const owner = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'owner',
      }) as string;

      return owner.toLowerCase() === address?.toLowerCase();
    } catch (error) {
      console.error('Error checking if user is owner:', error);
      return false;
    }
  };

  // Get platform fee percentage
  const getPlatformFee = async () => {
    try {
      const feeBps = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'platformFeeBps',
      }) as bigint;

      return Number(feeBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting platform fee:', error);
      return 0; // Return 0 on error
    }
  };

  // Get AI verification release percentage
  const getAIVerificationReleaseBps = async () => {
    try {
      const releaseBps = await publicClient.readContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'aiVerificationReleaseBps',
      }) as bigint;

      return Number(releaseBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting AI verification release percentage:', error);
      return 0; // Return 0 on error
    }
  };

  return {
    jobs,
    loading,
    fetchJobs,
    getJob,
    getJobApplications,
    getSubmission,
    getJobSubmission,
    getUserApplications,
    getUserPostedJobs,
    getUserSubmissions,
    isContractOwner,
    getPlatformFee,
    getAIVerificationReleaseBps
  };
}

export function useContractWrite() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Create job
  const createJob = async (title: string, description: string, deadline: number, value: string) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'createJob',
        args: [title, description, deadline],
        value: parseEther(value),
      });
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  };

  // Apply for job
  const applyForJob = async (jobId: number, proposal: string) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'applyForJob',
        args: [jobId, proposal],
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      throw error;
    }
  };

  // Accept application
  const acceptApplication = async (applicationId: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'acceptApplication',
        args: [applicationId],
      });
    } catch (error) {
      console.error('Error accepting application:', error);
      throw error;
    }
  };

  // Submit work
  const submitWork = async (jobId: number, deliverable: string) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'submitWork',
        args: [jobId, deliverable],
      });
    } catch (error) {
      console.error('Error submitting work:', error);
      throw error;
    }
  };

  // Verify work by AI (only owner)
  const verifyWorkByAI = async (submissionId: number, verified: boolean) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'verifyWorkByAI',
        args: [submissionId, verified],
      });
    } catch (error) {
      console.error('Error verifying work by AI:', error);
      throw error;
    }
  };

  // Approve work
  const approveWork = async (submissionId: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'approveWork',
        args: [submissionId],
      });
    } catch (error) {
      console.error('Error approving work:', error);
      throw error;
    }
  };

  // Cancel job
  const cancelJob = async (jobId: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'cancelJob',
        args: [jobId],
      });
    } catch (error) {
      console.error('Error canceling job:', error);
      throw error;
    }
  };

  // Update platform fee (only owner)
  const updatePlatformFee = async (newFeeBps: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'updatePlatformFee',
        args: [newFeeBps],
      });
    } catch (error) {
      console.error('Error updating platform fee:', error);
      throw error;
    }
  };

  // Update AI verification release percentage (only owner)
  const updateAIVerificationReleaseBps = async (newReleaseBps: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    try {
      return await writeContract({
        address: getContractAddress(),
        abi: CONTRACT_ABI,
        functionName: 'updateAIVerificationReleaseBps',
        args: [newReleaseBps],
      });
    } catch (error) {
      console.error('Error updating AI verification release percentage:', error);
      throw error;
    }
  };

  return {
    createJob,
    applyForJob,
    acceptApplication,
    submitWork,
    verifyWorkByAI,
    approveWork,
    cancelJob,
    updatePlatformFee,
    updateAIVerificationReleaseBps,
    isWritePending,
  };
}
