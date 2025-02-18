import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
}

export function ScheduleModal({ open, onOpenChange, onSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleTimeChange = (value: string) => {
    setTime(value);
    setError(null);
  };

  const handleSchedule = () => {
    if (!date) return;
    
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      setError("Please enter a valid time in 24-hour format (HH:mm)");
      return;
    }
    
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // Check if the selected time is in the future
    if (scheduledDate <= new Date()) {
      setError("Please select a future time");
      return;
    }
    onSchedule(scheduledDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Message</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
          <div className="grid gap-2">
            <Input
              type="text"
              placeholder="Enter time (HH:mm)"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <Button 
            onClick={handleSchedule}
            disabled={!date || !time}
          >
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 