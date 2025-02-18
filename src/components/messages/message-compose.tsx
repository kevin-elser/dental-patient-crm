'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MoreVertical, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScheduleModal } from "./schedule-modal";

interface MessageComposeProps {
  onSend: (message: string, scheduledFor: Date) => Promise<void>;
  disabled?: boolean;
}

export function MessageCompose({ onSend, disabled }: MessageComposeProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      // Always send a scheduledFor time - either the scheduled time or now for immediate sends
      const timeToSend = scheduledFor || new Date();
      await onSend(message, timeToSend);
      setMessage("");
      setScheduledFor(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isScheduleModalOpen && !scheduledFor) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSchedule = (date: Date) => {
    setScheduledFor(date);
    setIsScheduleModalOpen(false);
  };

  return (
    <>
      <div className="flex gap-2 p-4 border-t items-center relative">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-[100px] resize-none"
            disabled={disabled || isSending}
          />
          {scheduledFor && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 gap-1 items-center"
            >
              <Calendar className="h-3 w-3" />
              {scheduledFor.toLocaleDateString()} {scheduledFor.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsScheduleModalOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onSchedule={handleSchedule}
      />
    </>
  );
} 