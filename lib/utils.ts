import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatEther(wei: bigint): string {
  const ether = Number(wei) / 1e18;
  return ether.toFixed(4);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function calculateTimeLeft(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = deadline - now;

  if (timeLeft <= 0) {
    return "Expired";
  }

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);

  if (days > 0) {
    return `${days} days left`;
  } else {
    return `${hours} hours left`;
  }
}

export enum JobStatus {
  OPEN = 0,          // Open - Job is open for applications
  ASSIGNED = 1,      // Assigned - Job has been assigned to a freelancer
  SUBMITTED = 2,     // Submitted - Work has been submitted by the freelancer
  AI_VERIFIED = 3,   // AIVerified - Work has been verified by AI
  COMPLETED = 4,     // Completed - Work has been approved and payment released
  CANCELLED = 5      // Cancelled - Job has been cancelled
}

export enum ApplicationStatus {
  PENDING = 0,    // Application is pending
  ACCEPTED = 1,   // Application has been accepted
  REJECTED = 2    // Application has been rejected
}
