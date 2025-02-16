"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Patient {
  PatNum: string;
  FName: string | null;
  LName: string | null;
  Birthdate: Date | null;
  HmPhone: string | null;
  WkPhone: string | null;
  WirelessPhone: string | null;
  Email: string | null;
  PatStatus: number;
  Address: string | null;
  Gender: number;
  age: number;
  phoneNumber: string;
  status: "Active" | "Inactive";
}

interface MessageThread {
  patientId: string;
  patientName: string;
  colorIndex: number;
  lastMessage: {
    body: string;
    createdAt: Date;
    direction: "INBOUND" | "OUTBOUND";
  };
  patient: Patient;
}

interface MessageContextType {
  threads: MessageThread[];
  loading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessageThreads = async () => {
    try {
      const response = await fetch("/api/messages/threads");
      if (!response.ok) throw new Error("Failed to fetch message threads");
      const data = await response.json();
      setThreads(data);
      setError(null);
    } catch (error) {
      setError("Failed to load message threads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessageThreads();
  }, []);

  return (
    <MessageContext.Provider 
      value={{ 
        threads, 
        loading, 
        error, 
        refreshThreads: fetchMessageThreads 
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessageProvider");
  }
  return context;
} 