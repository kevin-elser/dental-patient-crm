"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PatientTable } from "@/components/patients/patient-table";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";


interface Patient {
  PatNum: string;
  LName: string | null;
  FName: string | null;
  HmPhone: string | null;
  WkPhone: string | null;
  WirelessPhone: string | null;
  Email: string | null;
  PatStatus: number;
  colorIndex: number;
}

interface PatientGroup {
  id: number;
  name: string;
  description: string | null;
  patients: Patient[];
  _count: {
    patients: number;
  };
}

export default function PatientGroupPage() {
  const { slug } = useParams();
  const [group, setGroup] = useState<PatientGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const response = await fetch(`/api/patients/groups/${slug}`);
        if (!response.ok) throw new Error("Failed to load group");
        const data = await response.json();
        setGroup(data);
      } catch (error) {
        console.error("Error loading group:", error);
        toast({
          title: "Error",
          description: "Failed to load patient group",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGroup();
  }, [slug, toast]);

  if (!group) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.description}
          </p>
        </div>
        <div className="flex gap-2">
          {/* TODO: Add email group functionality */}
          <Link href="#">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Email Group
            </Button>
          </Link>
          {/* TODO: Add message group functionality */}
          <Link href="#">
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              Message Group
            </Button>
          </Link>
        </div>
      </div>
      <PatientTable
        patients={group.patients}
        totalCount={group._count.patients}
        isLoading={isLoading}
      />
    </div>
  );
} 