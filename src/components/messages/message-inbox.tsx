'use client'

import { Phone, User, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageList } from "./message-list";
import { MessageCompose } from "./message-compose";
import { MessageThreads } from "./message-threads";
import { useMessages } from "@/contexts/message-context";
import { PatientInitials } from "@/components/patients/patient-initials";
import { NewMessageModal } from "./new-message-modal";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phoneNumber: string;
  colorIndex: number;
  status: "Active" | "Inactive";
}

interface MessageInboxProps {
  patient?: Patient;
  onSendMessage?: (message: string, scheduledFor: Date) => Promise<void>;
  variant?: "default" | "scheduled";
  className?: string;
}

export function MessageInbox({ 
  patient, 
  onSendMessage,
  variant = "default",
  className
}: MessageInboxProps) {
  const { threads, loading } = useMessages();
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);

  const filteredThreads = variant === "scheduled" 
    ? threads?.filter(thread => thread.hasScheduledMessages)
    : threads;

  if (loading) {
    return null; // Parent component handles loading state
  }

  // Only show compose for default variant and when we have both patient and onSendMessage
  const showCompose = variant === "default" && patient && onSendMessage;

  return (
    <div className={cn("flex h-screen", className)}>
      {/* Left Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-6 border-b flex justify-between items-center h-[88px]">
          <h1 className="text-xl font-semibold">
            {variant === "scheduled" ? "Scheduled" : "Inbox"}
          </h1>
          {variant === "default" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => setNewMessageModalOpen(true)}
            >
              <PenSquare className="h-6 w-6" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageThreads 
            threads={filteredThreads}
            currentPatientId={patient?.id}
            variant={variant}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {patient ? (
          <>
            {/* Patient Header */}
            <div className="p-6 border-b flex justify-between items-center h-[88px]">
              <div className="flex items-center gap-3">
                <PatientInitials
                  firstName={patient.name.split(" ")[0]}
                  lastName={patient.name.split(" ")[1]}
                  colorIndex={patient.colorIndex}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{patient.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      {patient.gender} · {patient.age} · {patient.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    To: {patient.phoneNumber}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Phone className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <User className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                key={patient.id}
                patientId={patient.id}
                currentUserNumber={process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || ""}
                variant={variant}
              />
            </div>

            {/* Compose Area */}
            {showCompose && (
              <MessageCompose onSend={onSendMessage} />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to view messages
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        open={newMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
      />
    </div>
  );
} 