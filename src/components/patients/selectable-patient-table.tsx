"use client";

import { useState, useEffect } from "react";
import { PatientTable } from "./patient-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SelectablePatientTableProps {
  patients: any[];
  totalCount: number;
  isLoading?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface Patient {
  PatNum: string;
  LName: string | null;
  FName: string | null;
}

export function SelectablePatientTable({
  patients,
  totalCount,
  isLoading,
  onSelectionChange,
}: SelectablePatientTableProps) {
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Only select/deselect currently visible patients
  const handleSelectAll = async () => {
    // If no search query, don't allow selecting all
    if (!searchQuery.trim()) return;

    try {
      // Get all patients matching the search query
      const response = await fetch(`/api/patients?page=0&search=${searchQuery}&all=true`);
      const data = await response.json();
      const allMatchingIds = data.patients.map((p: Patient) => p.PatNum);

      // Check if all matching patients are selected
      const allSelected = allMatchingIds.every((id: string) => selectedPatients.has(id));
      
      if (allSelected) {
        // Deselect all matching patients
        const selection = new Set(selectedPatients);
        allMatchingIds.forEach((id: string) => selection.delete(id));
        setSelectedPatients(selection);
      } else {
        // Select all matching patients
        const selection = new Set(selectedPatients);
        allMatchingIds.forEach((id: string) => selection.add(id));
        setSelectedPatients(selection);
      }
    } catch (error) {
      console.error('Error fetching all matching patients:', error);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    const selection = new Set(selectedPatients);
    if (selection.has(patientId)) {
      selection.delete(patientId);
    } else {
      selection.add(patientId);
    }
    setSelectedPatients(selection);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/patients/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: description.trim() || null,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()) : null,
          patientIds: Array.from(selectedPatients),
        }),
      });

      if (!response.ok) throw new Error("Failed to create group");

      toast({
        title: "Success",
        description: "Patient group created successfully",
      });
      router.push("/patients/groups");
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create patient group",
        variant: "destructive",
      });
    }
  };

  // Extend the patient table with selection column
  const SelectionHeader = () => {
    const [isAllSelected, setIsAllSelected] = useState(false);

    // Update header checkbox state when visible patients change
    useEffect(() => {
      const checkSelection = async () => {
        if (!searchQuery.trim()) {
          setIsAllSelected(false);
          return;
        }

        try {
          const response = await fetch(`/api/patients?page=0&search=${searchQuery}&all=true`);
          const data = await response.json();
          const allMatchingIds = data.patients.map((p: Patient) => p.PatNum);
          setIsAllSelected(allMatchingIds.every((id: string) => selectedPatients.has(id)));
        } catch (error) {
          console.error('Error checking selection state:', error);
        }
      };

      checkSelection();
    }, [searchQuery, selectedPatients]);

    return (
      <div className="px-1">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          disabled={!searchQuery.trim()}
        />
      </div>
    );
  };

  const SelectionCell = ({ patientId }: { patientId: string }) => (
    <div className="px-1">
      <Checkbox
        checked={selectedPatients.has(patientId)}
        onCheckedChange={() => handleSelectPatient(patientId)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full gap-4">
          <Input
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={selectedPatients.size === 0 || !groupName.trim()}
            className="shrink-0"
          >
            Create Group
          </Button>
        </div>
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
        />
        <Input
          placeholder="Tags (optional, comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full"
        />
      </div>

      <PatientTable
        patients={patients}
        totalCount={totalCount}
        isLoading={isLoading}
        extraHeader={<SelectionHeader />}
        extraCell={(patient) => <SelectionCell patientId={patient.PatNum} />}
        onSearchChange={setSearchQuery}
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Patient Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create a group named "{groupName}" with {selectedPatients.size} patients?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateGroup}>
              Create Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 