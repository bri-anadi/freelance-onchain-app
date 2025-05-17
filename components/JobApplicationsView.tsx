// components/JobApplicationsView.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { formatAddress, ApplicationStatus } from '@/lib/utils';
import { useContractRead, useContractWrite } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';

interface JobApplicationsViewProps {
  jobId: number;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobApplicationsView({
  jobId,
  jobTitle,
  isOpen,
  onClose
}: JobApplicationsViewProps) {
  const { address, isConnected } = useAccount();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const { toast } = useToast();

  // Contract hooks
  const { getJobApplications } = useContractRead();
  const { acceptApplication, isWritePending } = useContractWrite();

  // Fetch applications for this job
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isConnected || !isOpen) return;

      try {
        setLoading(true);
        const jobApplications = await getJobApplications(jobId);
        setApplications(jobApplications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job applications:', error);
        setLoading(false);
        toast({
          title: 'Error Loading Applications',
          description: 'There was an error loading the applications. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchApplications();
  }, [isConnected, isOpen, jobId]);

  // Handle accepting an application
  const handleAcceptApplication = async (applicationId: number) => {
    if (!isConnected) return;

    try {
      // Call contract method to accept application
      const hash = await acceptApplication(applicationId);

      // Update the application in the list (optimistic update)
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: ApplicationStatus.ACCEPTED } : app
        )
      );

      // Close the application detail dialog
      setSelectedApplication(null);

      // Show success message
      toast({
        title: 'Application Accepted',
        description: `You have successfully accepted this application. The freelancer can now begin work on the job.`,
      });
    } catch (error) {
      console.error('Error accepting application:', error);
      toast({
        title: 'Error Accepting Application',
        description: 'There was an error accepting this application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get status badge for an application
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.ACCEPTED:
        return <Badge variant="default">Accepted</Badge>;
      case ApplicationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  // Get the first letter of the address for the avatar
  const getAddressInitial = (address: string) => {
    return address ? address.substring(2, 3).toUpperCase() : '?';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Applications for {jobTitle}</DialogTitle>
          <DialogDescription>
            Review and manage applications for this job posting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No applications received yet for this job.</p>
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-primary/10">
                            <AvatarFallback>
                              {getAddressInitial(application.freelancer)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {formatAddress(application.freelancer)}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Submitted {new Date(application.timestamp * 1000).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="line-clamp-3 text-sm">
                        {application.proposal}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setSelectedApplication(application)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Application Detail Dialog */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review this application before making a decision.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 bg-primary/10">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{formatAddress(selectedApplication.freelancer)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Applied {new Date(selectedApplication.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(selectedApplication.status)}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Proposal:</h4>
                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                  {selectedApplication.proposal}
                </div>
              </div>
            </div>
            <DialogFooter>
              {selectedApplication.status === ApplicationStatus.PENDING && (
                <div className="flex w-full space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    disabled={isWritePending}
                    onClick={() => handleAcceptApplication(selectedApplication.id)}
                  >
                    {isWritePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                </div>
              )}

              {selectedApplication.status !== ApplicationStatus.PENDING && (
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
