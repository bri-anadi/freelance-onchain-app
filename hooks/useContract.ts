'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther, parseAbiItem } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [lastScannedBlock, setLastScannedBlock] = useState<bigint>(BigInt(0));
  const [loadingProgress, setLoadingProgress] = useState<string>('');

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Fetch all jobs with block range pagination
  const fetchJobs = async (forceRefresh = false) => {
    if (!isConnected) return;

    // Check if we have cached data that's still fresh
    const now = Date.now();
    if (!forceRefresh && jobs.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      console.log('Using cached job data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadingProgress('Initializing blockchain scan...');

      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();

      // Define the block range size (stay below the 500 block limit)
      const BLOCK_RANGE = BigInt(400);

      // Define how far back to look for jobs (e.g., last ~1 month of blocks)
      // Base produces ~1 block every 2 seconds, so ~15,000 blocks per day
      const MAX_BLOCKS_TO_FETCH = BigInt(150000); // ~10 days

      // Calculate starting block (don't go before genesis block)
      let startBlock = lastScannedBlock > BigInt(0) && !forceRefresh
        ? lastScannedBlock - BigInt(10) // Start from last scan with small overlap
        : (currentBlock > MAX_BLOCKS_TO_FETCH ? currentBlock - MAX_BLOCKS_TO_FETCH : BigInt(0));

      console.log(`Fetching jobs from block ${startBlock} to ${currentBlock}`);
      setLoadingProgress(`Scanning blocks ${startBlock} to ${currentBlock}...`);

      // Array to store all events
      let allJobEvents: any[] = [];
      const fetchedJobs: any[] = [];

      // Fetch logs in chunks
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_RANGE) {
        let toBlock = fromBlock + BLOCK_RANGE - BigInt(1);
        if (toBlock > currentBlock) toBlock = currentBlock;

        setLoadingProgress(`Scanning blocks ${fromBlock} to ${toBlock} of ${currentBlock}...`);

        try {
          const jobEvents = await publicClient.getLogs({
            address: getContractAddress() as `0x${string}`,
            event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed poster, uint256 reward)'),
            fromBlock,
            toBlock,
          });

          allJobEvents = [...allJobEvents, ...jobEvents];

          // Process events in batches to show progress
          if (jobEvents.length > 0) {
            setLoadingProgress(`Found ${allJobEvents.length} job events, processing details...`);

            for (const event of jobEvents) {
              if (event.args && event.args.jobId !== undefined) {
                try {
                  const jobId = Number(event.args.jobId);
                  const jobDetails = await publicClient.readContract({
                    address: getContractAddress() as `0x${string}`,
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

            // Update the jobs state incrementally
            setJobs(prev => {
              // Combine previous and new jobs, removing duplicates by ID
              const combined = [...prev, ...fetchedJobs.slice()];
              const uniqueJobs = Array.from(
                new Map(combined.map(job => [job.id, job])).values()
              );
              return uniqueJobs;
            });

            setLoadingProgress(`Processed ${fetchedJobs.length} jobs, continuing scan...`);
          }
        } catch (error) {
          console.error(`Error fetching logs for block range ${fromBlock}-${toBlock}:`, error);
        }
      }

      // After successful scan, update the last scanned block
      setLastScannedBlock(currentBlock);
      setLastFetchTime(now);
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
        address: getContractAddress() as `0x${string}`,
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

  // Get job applications with pagination
  const getJobApplications = async (jobId: number) => {
    try {
      const applicationIds = await publicClient.readContract({
        address: getContractAddress() as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getJobApplications',
        args: [jobId],
      }) as bigint[];

      const applications = [];
      for (const appId of applicationIds) {
        const application = await publicClient.readContract({
          address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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

  // Get user submitted applications with pagination
  const getUserApplications = async (userAddress: string) => {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const BLOCK_RANGE = BigInt(400);
      const MAX_BLOCKS_TO_FETCH = BigInt(450000); // ~30 days
      const startBlock = currentBlock > MAX_BLOCKS_TO_FETCH ? currentBlock - MAX_BLOCKS_TO_FETCH : BigInt(0);

      let allApplicationEvents: any[] = [];

      // Fetch application events in chunks
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_RANGE) {
        let toBlock = fromBlock + BLOCK_RANGE - BigInt(1);
        if (toBlock > currentBlock) toBlock = currentBlock;

        try {
          const events = await publicClient.getLogs({
            address: getContractAddress() as `0x${string}`,
            event: parseAbiItem('event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed jobId, address indexed freelancer)'),
            args: {
              freelancer: userAddress as `0x${string}`
            },
            fromBlock,
            toBlock,
          });

          allApplicationEvents = [...allApplicationEvents, ...events];
        } catch (error) {
          console.error(`Error fetching application logs for block range ${fromBlock}-${toBlock}:`, error);
        }
      }

      const applications = [];

      for (const event of allApplicationEvents) {
        if (event.args && event.args.applicationId !== undefined) {
          try {
            const applicationId = Number(event.args.applicationId);
            const application = await publicClient.readContract({
              address: getContractAddress() as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'applications',
              args: [applicationId],
            });

            if (application) {
              const [id, jobId, freelancer, proposal, status, timestamp] = application as [bigint, bigint, string, string, number, bigint];

              // Get job title
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

  // Get user posted jobs with pagination
  const getUserPostedJobs = async (userAddress: string) => {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const BLOCK_RANGE = BigInt(400);
      const MAX_BLOCKS_TO_FETCH = BigInt(450000); // ~30 days
      const startBlock = currentBlock > MAX_BLOCKS_TO_FETCH ? currentBlock - MAX_BLOCKS_TO_FETCH : BigInt(0);

      let allJobEvents: any[] = [];

      // Fetch job events in chunks
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_RANGE) {
        let toBlock = fromBlock + BLOCK_RANGE - BigInt(1);
        if (toBlock > currentBlock) toBlock = currentBlock;

        try {
          const events = await publicClient.getLogs({
            address: getContractAddress() as `0x${string}`,
            event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed poster, uint256 reward)'),
            args: {
              poster: userAddress as `0x${string}`
            },
            fromBlock,
            toBlock,
          });

          allJobEvents = [...allJobEvents, ...events];
        } catch (error) {
          console.error(`Error fetching job logs for block range ${fromBlock}-${toBlock}:`, error);
        }
      }

      const postedJobs = [];

      for (const event of allJobEvents) {
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

  // Get user submissions with pagination
  const getUserSubmissions = async (userAddress: string) => {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const BLOCK_RANGE = BigInt(400);
      const MAX_BLOCKS_TO_FETCH = BigInt(450000); // ~30 days
      const startBlock = currentBlock > MAX_BLOCKS_TO_FETCH ? currentBlock - MAX_BLOCKS_TO_FETCH : BigInt(0);

      let allSubmissionEvents: any[] = [];

      // Fetch submission events in chunks
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_RANGE) {
        let toBlock = fromBlock + BLOCK_RANGE - BigInt(1);
        if (toBlock > currentBlock) toBlock = currentBlock;

        try {
          const events = await publicClient.getLogs({
            address: getContractAddress() as `0x${string}`,
            event: parseAbiItem('event WorkSubmitted(uint256 indexed submissionId, uint256 indexed jobId, address indexed freelancer)'),
            args: {
              freelancer: userAddress as `0x${string}`
            },
            fromBlock,
            toBlock,
          });

          allSubmissionEvents = [...allSubmissionEvents, ...events];
        } catch (error) {
          console.error(`Error fetching submission logs for block range ${fromBlock}-${toBlock}:`, error);
        }
      }

      const submissions = [];

      for (const event of allSubmissionEvents) {
        if (event.args && event.args.submissionId !== undefined) {
          try {
            const submissionId = Number(event.args.submissionId);
            const submission = await getSubmission(submissionId);

            if (submission) {
              // Get job title
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

  // Check if user is contract owner with error handling
  const isContractOwner = async () => {
    try {
      // Determine which chain we're on
      const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;

      if (chainId === 'mainnet') {
        try {
          const owner = await publicClient.readContract({
            address: getContractAddress() as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'owner',
          }) as string;

          return owner.toLowerCase() === address?.toLowerCase();
        } catch (error) {
          console.error('Error checking if user is owner on mainnet:', error);
          // For mainnet, if the owner function isn't available, check against hardcoded address
          // Replace with the actual owner address of your contract
          return address?.toLowerCase() === "0x8EBEB59c0a650eD5B99af1903B3BA80a297d3C85".toLowerCase();
        }
      } else {
        // For testnet, use standard approach
        const owner = await publicClient.readContract({
          address: getContractAddress() as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'owner',
        }) as string;

        return owner.toLowerCase() === address?.toLowerCase();
      }
    } catch (error) {
      console.error('Error checking if user is owner:', error);
      return false;
    }
  };

  // Get platform fee percentage
  const getPlatformFee = async () => {
    try {
      const feeBps = await publicClient.readContract({
        address: getContractAddress() as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'platformFeeBps',
      }) as bigint;

      return Number(feeBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting platform fee:', error);
      return 2.5; // Return default on error
    }
  };

  // Get AI verification release percentage
  const getAIVerificationReleaseBps = async () => {
    try {
      const releaseBps = await publicClient.readContract({
        address: getContractAddress() as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'aiVerificationReleaseBps',
      }) as bigint;

      return Number(releaseBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting AI verification release percentage:', error);
      return 70; // Return default on error
    }
  };

  return {
    jobs,
    loading,
    loadingProgress,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
        address: getContractAddress() as `0x${string}`,
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
