'use client';

import { MessageInbox } from "@/components/messages/message-inbox";
import { MessageInboxSkeleton } from "@/components/messages/message-inbox-skeleton";
import { useMessages } from "@/contexts/message-context";

export default function ScheduledMessagesPage() {
  const { loading, error } = useMessages();

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

  return <MessageInbox variant="scheduled" />;
} 