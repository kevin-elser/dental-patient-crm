import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PatientInitials } from "@/components/patients/patient-initials";
import { Skeleton } from "@/components/ui/skeleton";

interface Patient {
  PatNum: string;
  FName: string | null;
  LName: string | null;
  WirelessPhone: string | null;
  HmPhone: string | null;
  WkPhone: string | null;
  colorIndex: number;
}

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
}

function PatientSearchSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  );
}

export function NewMessageModal({ open, onClose }: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 3) {
      setPatients([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients?page=0&search=${query}&limit=5`);
      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPatients]);

  const handlePatientSelect = (patient: Patient) => {
    router.push(`/messages/${patient.PatNum}`);
    onClose();
  };

  const getPrimaryPhone = (patient: Patient) => {
    return patient.WirelessPhone || patient.HmPhone || patient.WkPhone || null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {searchQuery.length < 3 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Enter at least 3 characters to search
              </p>
            ) : isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <PatientSearchSkeleton key={i} />
              ))
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No patients found
              </p>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.PatNum}
                  className="w-full flex items-center gap-3 p-4 border-b hover:bg-muted/50 transition-colors text-left"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <PatientInitials
                    firstName={patient.FName}
                    lastName={patient.LName}
                    colorIndex={patient.colorIndex}
                  />
                  <div>
                    <div className="font-medium">
                      {patient.FName} {patient.LName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getPrimaryPhone(patient) || "No phone number"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 