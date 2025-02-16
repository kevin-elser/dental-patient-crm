import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PatientInitials } from "@/components/patients/patient-initials";

interface MessageThread {
  patientId: string;
  patientName: string;
  colorIndex: number;
  lastMessage: {
    body: string;
    createdAt: Date;
    direction: "INBOUND" | "OUTBOUND";
  };
  unreadCount?: number;
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
        return (
          <Link
            key={thread.patientId}
            href={`/messages/${thread.patientId}`}
            className={`block p-4 border-b hover:bg-muted/50 transition-colors ${
              currentPatientId === thread.patientId ? "bg-muted" : ""
            }`}
          >
            <div className="flex gap-3 items-center">
              <PatientInitials
                firstName={firstName}
                lastName={lastName}
                colorIndex={thread.colorIndex}
                className="shrink-0"
              />
              <div className="min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium truncate">{thread.patientName}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(thread.lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {thread.lastMessage.direction === "OUTBOUND" && "You: "}
                  {thread.lastMessage.body}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 