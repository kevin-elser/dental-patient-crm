"use client";

import { useEffect, useState } from "react";
import { MessageInbox } from "@/components/messages/message-inbox";
import { MessageInboxSkeleton } from "@/components/messages/message-inbox-skeleton";
import { useParams, useRouter } from "next/navigation";
import { useMessages } from "@/contexts/message-context";

export default function PatientMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.patientId as string;
  const { threads, loading, error, refreshThreads } = useMessages();
  const [hasFetchedPatient, setHasFetchedPatient] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setHasFetchedPatient(false);
    setPatientData(null);
    setFetchError(null);
  }, [patientId]);

  useEffect(() => {
    // If we're on a special route like 'received', redirect to the first thread
    if ((patientId === 'received' || patientId === 'all') && threads.length > 0) {
      router.replace(`/messages/${threads[0].patientId}`);
      return;
    }

    // Only fetch patient info if we don't have it and haven't tried yet
    const hasThread = threads.find(t => t.patientId === patientId);
    if (!loading && !error && !hasThread && !hasFetchedPatient) {
      setHasFetchedPatient(true);
      
      fetch(`/api/messages/threads?patientId=${patientId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch patient');
          return res.json();
        })
        .then(data => {
          if (!data.error && data.length > 0) {
            setPatientData(data[0]);
            refreshThreads();
          } else if (data.error) {
            setFetchError(data.error);
          }
        })
        .catch(error => {
          console.error("Error fetching patient thread:", error);
          setFetchError("Failed to fetch patient information");
        });
    }
  }, [patientId, threads, router, loading, error, refreshThreads, hasFetchedPatient]);

  const handleSendMessage = async (message: string, scheduledFor: Date) => {
    try {
      const requestBody = {
        patientId,
        body: message,
        scheduledFor: scheduledFor.toISOString()
      };

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      // Wait for both the message list and threads to refresh
      await Promise.all([
        refreshThreads(),
        // Add any message list refresh function here from your context
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  if (loading) {
    return <MessageInboxSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  const currentThread = threads.find(t => t.patientId === patientId);
  
  // If we have neither a thread nor patient data and haven't tried fetching yet
  if (!currentThread && !patientData && !hasFetchedPatient) {
    return <MessageInboxSkeleton />;
  }

  // If we've tried fetching and got an error
  if (fetchError) {
    return (
      <div className="p-4 text-red-500">
        {fetchError}
      </div>
    );
  }

  // Use either the thread data or the fetched patient data
  const threadData = currentThread || patientData;
  if (!threadData) {
    return (
      <div className="p-4 text-red-500">
        Patient not found
      </div>
    );
  }

  const patient = {
    id: threadData.patientId,
    name: threadData.patientName,
    colorIndex: threadData.colorIndex,
    age: threadData.patient.age,
    gender: threadData.patient.Gender === 1 ? "Female" : threadData.patient.Gender === 2 ? "Male" : "Unknown",
    phoneNumber: threadData.patient.phoneNumber,
    status: threadData.patient.status,
  };

  return (
    <MessageInbox
      patient={patient}
      onSendMessage={handleSendMessage}
    />
  );
} 