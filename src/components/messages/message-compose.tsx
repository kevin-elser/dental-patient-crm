import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageComposeProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageCompose({ onSend, disabled }: MessageComposeProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSend(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t items-center">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        className="min-h-[100px] resize-none"
        disabled={disabled || isSending}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled || isSending}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
} 