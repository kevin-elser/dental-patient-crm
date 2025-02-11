import { Metadata } from "next";
import { PatientGroupsTable } from "@/components/patient-groups/patient-groups-table";

export const metadata: Metadata = {
  title: "Patient Groups",
  description: "Manage patient groups and sublists",
};

export default function PatientGroupsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Groups</h1>
          <p className="text-muted-foreground">
            Create and manage patient groups and sublists
          </p>
        </div>
      </div>
      <PatientGroupsTable />
    </div>
  );
} 