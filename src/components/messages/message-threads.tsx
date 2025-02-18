import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PatientInitials } from "@/components/patients/patient-initials";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageThread {
  patientId: string;
  patientName: string;
  colorIndex: number;
  lastMessage: {
    body: string;
    createdAt: Date;
    direction: "INBOUND" | "OUTBOUND";
    scheduledFor?: Date;
  };
  unreadCount?: number;
  hasScheduledMessages?: boolean;
}

interface MessageThreadsProps {
  threads: MessageThread[];
  currentPatientId?: string;
}

export function MessageThreads({ threads, currentPatientId }: MessageThreadsProps) {
  return (
    <div className="flex-1 overflow-auto">
      {threads.map((thread) => {
        const [firstName, lastName] = thread.patientName.split(" ");
        const isScheduled = thread.hasScheduledMessages;  
        
        return (
          <Link
            key={thread.patientId}
            href={`/messages/${thread.patientId}`}
            className={`block p-4 border-b hover:bg-muted/50 transition-colors ${
              currentPatientId === thread.patientId ? "bg-muted" : ""
            } ${isScheduled ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}`}
          >
            <div className="flex gap-3 items-center">
              <PatientInitials
                firstName={firstName}
                lastName={lastName}
                colorIndex={thread.colorIndex}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium truncate">{thread.patientName}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(thread.lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {thread.lastMessage.direction === "OUTBOUND" && "You: "}
                    {thread.lastMessage.body}
                  </p>
                  {isScheduled && (
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <Calendar className="h-3 w-3" />
                      Scheduled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 