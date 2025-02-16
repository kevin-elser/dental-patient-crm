"use client";

import { useEffect, useState } from "react";
import { MessageInbox } from "@/components/messages/message-inbox";
import { MessageInboxSkeleton } from "@/components/messages/message-inbox-skeleton";
import { useMessages } from "@/contexts/message-context";

// This would come from your API
interface MessageThread {
  patientId: string;
  patientName: string;
  colorIndex: number;
  lastMessage: {
    body: string;
    createdAt: Date;
    direction: "INBOUND" | "OUTBOUND";
  };
  patient: {
    age: number;
    Gender: number;
    phoneNumber: string;
    status: string;
  };
}

export default function MessagesAllPage() {
  const { threads, loading, error, refreshThreads } = useMessages();

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

  if (threads.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  // Show the first thread by default
  const defaultThread = threads[0];
  const defaultPatient = {
    id: defaultThread.patientId,
    name: defaultThread.patientName,
    colorIndex: defaultThread.colorIndex,
    age: defaultThread.patient.age,
    gender: defaultThread.patient.Gender === 1 ? "Female" : defaultThread.patient.Gender === 2 ? "Male" : "Unknown",
    phoneNumber: defaultThread.patient.phoneNumber,
    status: defaultThread.patient.status,
  };

  return (
    <MessageInbox
      patient={defaultPatient}
      onSendMessage={async (message) => {
        try {
          const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patientId: defaultPatient.id,
              body: message,
            }),
          });

          if (!response.ok) throw new Error("Failed to send message");
          await refreshThreads();
        } catch (error) {
          console.error("Error sending message:", error);
          throw error;
        }
      }}
    />
  );
}