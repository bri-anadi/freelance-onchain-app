'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { JobStatus, ApplicationStatus } from '@/lib/utils';

// Determine the chain based on environment
const getContractAddress = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId === 'mainnet' ? CONTRACT_ADDRESS.mainnet : CONTRACT_ADDRESS.testnet;
};

export function useContractRead() {
  const { address, isConnected } = useAccount();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get job by ID
  const getJob = async (jobId: number) => {
    try {
      // Para este ejemplo, usamos datos simulados
      // En una app real, usarías readContract de viem directamente (no useReadContract)
      return {
        id: jobId,
        poster: '0x123456789abcdef123456789abcdef123456789a',
        title: 'Example Job',
        description: 'This is an example job description',
        reward: BigInt('1000000000000000000'),
        deadline: Math.floor(Date.now() / 1000) + 604800,
        status: JobStatus.OPEN,
        assignedFreelancer: '0x0000000000000000000000000000000000000000'
      };
    } catch (error) {
      console.error('Error getting job details:', error);
      throw error;
    }
  };

  // Fetch all jobs (in a real app, this would use events or an indexer)
  const fetchJobs = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      // In a real app, you would fetch from an indexer or scan events
      // For this demo, we're simulating data
      setTimeout(() => {
        const mockJobs = [
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
        ];
        setJobs(mockJobs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  // Get job applications
  const getJobApplications = async (jobId: number) => {
    try {
      // Datos simulados para el ejemplo
      return [
        {
          id: 1,
          jobId,
          freelancer: '0x1234567890abcdef1234567890abcdef12345678',
          proposal: 'I have experience with this kind of project and can deliver it on time.',
          status: ApplicationStatus.PENDING,
          timestamp: Math.floor(Date.now() / 1000) - 86400
        },
        {
          id: 2,
          jobId,
          freelancer: '0x2345678901abcdef2345678901abcdef23456789',
          proposal: 'I would love to work on this project. I have similar experience.',
          status: ApplicationStatus.PENDING,
          timestamp: Math.floor(Date.now() / 1000) - 172800
        }
      ];
    } catch (error) {
      console.error('Error getting job applications:', error);
      throw error;
    }
  };

  // Get submission by ID
  const getSubmission = async (submissionId: number) => {
    try {
      // Datos simulados para el ejemplo
      return {
        id: submissionId,
        jobId: 1,
        freelancer: '0x1234567890abcdef1234567890abcdef12345678',
        deliverable: 'I have completed the project. You can view it at https://example.com/project',
        aiVerified: false,
        posterApproved: false,
        timestamp: Math.floor(Date.now() / 1000) - 43200
      };
    } catch (error) {
      console.error('Error getting submission details:', error);
      throw error;
    }
  };

  // Get job submission by job ID
  const getJobSubmission = async (jobId: number) => {
    try {
      // Datos simulados para el ejemplo
      return {
        id: 1,
        jobId,
        freelancer: '0x1234567890abcdef1234567890abcdef12345678',
        deliverable: 'I have completed the project. You can view it at https://example.com/project',
        aiVerified: false,
        posterApproved: false,
        timestamp: Math.floor(Date.now() / 1000) - 43200
      };
    } catch (error) {
      console.error('Error getting job submission:', error);
      throw error;
    }
  };

  // Get user submitted applications (in a real app, this would filter events by user address)
  const getUserApplications = async (address: string) => {
    // In a real app, you would query events or use an indexer
    // For this demo, we're returning mock data
    const mockApplications = [
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
    ];
    return mockApplications;
  };

  // Get user posted jobs (in a real app, this would filter jobs by poster address)
  const getUserPostedJobs = async (address: string) => {
    // In a real app, you would query events or use an indexer
    // For this demo, we're returning mock data
    const mockPostedJobs = [
      {
        id: 3,
        title: 'Develop Solidity Smart Contract',
        description: 'Need a developer to write a custom smart contract for a DAO.',
        reward: BigInt('2000000000000000000'), // 2 ETH
        deadline: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
        status: JobStatus.OPEN,
      },
    ];
    return mockPostedJobs;
  };

  // Get user submissions (in a real app, this would filter submissions by freelancer address)
  const getUserSubmissions = async (address: string) => {
    // In a real app, you would query events or use an indexer
    // For this demo, we're returning mock data
    const mockSubmissions = [
      {
        id: 1,
        jobId: 2,
        jobTitle: 'Design NFT Collection',
        deliverable: 'I have completed the 10 NFT designs as requested. You can view them at https://example.com/nft-designs',
        aiVerified: true,
        posterApproved: false,
        timestamp: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
      },
    ];
    return mockSubmissions;
  };

  // Check if user is contract owner
  const isContractOwner = async () => {
    try {
      // Datos simulados para el ejemplo
      // En una app real, compararías la dirección del usuario con la del propietario del contrato
      return address === '0x0000000000000000000000000000000000000001';
    } catch (error) {
      console.error('Error checking if user is owner:', error);
      return false;
    }
  };

  // Get platform fee percentage
  const getPlatformFee = async () => {
    try {
      // Datos simulados para el ejemplo
      return 2.5; // 2.5%
    } catch (error) {
      console.error('Error getting platform fee:', error);
      return 2.5; // Default 2.5%
    }
  };

  // Get AI verification release percentage
  const getAIVerificationReleaseBps = async () => {
    try {
      // Datos simulados para el ejemplo
      return 70; // 70%
    } catch (error) {
      console.error('Error getting AI verification release percentage:', error);
      return 70; // Default 70%
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
