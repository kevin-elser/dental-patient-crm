import { MessageProvider } from "@/contexts/message-context";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessageProvider>
      {children}
    </MessageProvider>
  );
} 