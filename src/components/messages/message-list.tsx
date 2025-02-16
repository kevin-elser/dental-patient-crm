import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  createdAt: Date;
};

interface MessageListProps {
  patientId: string;
  currentUserNumber: string;
}

function MessageSkeleton() {
  return (
    <Card className="p-4 mr-auto bg-muted max-w-[80%] rounded-lg">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-[250px]" />
        <div className="flex justify-between items-center mt-2">
          <Skeleton className="h-3 w-[100px]" />
          <Skeleton className="h-3 w-[60px]" />
        </div>
      </div>
    </Card>
  );
}

export function MessageList({ patientId, currentUserNumber }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useRef(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const fetchMessages = async (page: number) => {
    try {
      const response = await fetch(`/api/messages/${patientId}?page=${page}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      // Reverse the messages so newest are at the bottom
      if (data.messages) {
        data.messages.reverse();
      }
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
      return null;
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage.current + 1;
    const data = await fetchMessages(nextPage);
    
    if (data) {
      // Add older messages to the beginning
      setMessages(prev => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      currentPage.current = nextPage;
    }
    setIsLoadingMore(false);
  };

  // Initial load of messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      currentPage.current = 0;
      const data = await fetchMessages(0);
      
      if (data) {
        setMessages(data.messages || []);
        setHasMore(data.hasMore || false);
        lastMessageRef.current = data.messages?.[data.messages?.length - 1]?.id || null;
      }
      setIsLoading(false);
      // Scroll to bottom after loading and rendering is complete
      setTimeout(scrollToBottom, 100);
    };

    loadInitialMessages();
  }, [patientId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (!isLoading && !isLoadingMore && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading, isLoadingMore]);

  // Poll for new messages with reduced frequency
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isLoading || isLoadingMore) return;

      const data = await fetchMessages(0);
      if (data && data.messages.length > 0) {
        const lastKnownMessageId = lastMessageRef.current;
        const newMessages = data.messages.filter(
          (msg: Message) => !messages.some(existing => existing.id === msg.id)
        );

        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
          lastMessageRef.current = data.messages[data.messages.length - 1].id;
          scrollToBottom();
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [messages, isLoading, isLoadingMore, patientId]);

  // Infinite scroll observer for loading older messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isLoadingMore, hasMore]);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className="mt-4 h-full px-4 pb-4"
    >
      <div className="space-y-4">
        {/* Loading older messages indicator */}
        {isLoadingMore && (
          Array.from({ length: 3 }).map((_, index) => (
            <MessageSkeleton key={`loading-more-${index}`} />
          ))
        )}
        
        {/* Infinite scroll observer target for older messages */}
        <div ref={observerTarget} className="h-4" />

        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <MessageSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <Card
                    key={message.id}
                    className={`p-4 ${
                      message.direction === "OUTBOUND"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "mr-auto bg-muted"
                    } max-w-[80%] rounded-lg`}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm">{message.body}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-xs opacity-70">
                          {message.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
                {/* Bottom anchor for scrolling */}
                <div ref={bottomRef} />
              </>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
} 