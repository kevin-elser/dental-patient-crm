'use client'

import { Phone, MessageSquare } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PatientInitials } from "./patient-initials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { PatientListItem } from "@/app/api/patients/route"
import { PatientDetails } from "@/app/api/patients/[id]/route"
import { PatientNotes } from "./patient-notes"

interface PatientDetailSidebarProps {
  patient: PatientListItem | null
  open: boolean
  onClose: () => void
}

function getPatientStatus(status: number): string {
  switch (status) {
    case 1:
      return 'Active';
    case 2:
      return 'Inactive';
    case 0:
    default:
      return 'Unknown';
  }
}

function getPatientGender(gender: number): string {
  switch (gender) {
    case 1:
      return 'Female';
    case 2:
      return 'Male';
    case 0:
    default:
      return 'Unknown';
  }
}

function formatAddress(address: string | null): { street: string; cityStateZip: string } {
  if (!address) return { street: '-', cityStateZip: '' };
  
  // Try to split on comma first (for "street, city state zip" format)
  const parts = address.split(',');
  
  if (parts.length > 1) {
    return {
      street: parts[0].trim(),
      cityStateZip: parts.slice(1).join(',').trim()
    };
  }
  
  // If no comma, try to split on the last space (assuming it's a city or state)
  const words = address.split(' ');
  if (words.length > 1) {
    return {
      street: words.slice(0, -1).join(' ').trim(),
      cityStateZip: words[words.length - 1].trim()
    };
  }
  
  // If no clear separation, just return the whole thing as street
  return {
    street: address.trim(),
    cityStateZip: ''
  };
}

export function PatientDetailSidebar({ patient: initialPatient, open, onClose }: PatientDetailSidebarProps) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);

  useEffect(() => {
    if (open && initialPatient) {
      // Fetch complete patient data when sidebar opens
      fetch(`/api/patients/${initialPatient.PatNum}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setPatient(data);
          }
        })
        .catch(error => {
          console.error('Error fetching patient details:', error);
          setPatient(initialPatient as PatientDetails); // Fallback to initial data if fetch fails
        });
    } else {
      setPatient(null);
    }
  }, [open, initialPatient]);

  const handleAddNote = async (note: { title: string; content: string }) => {
    if (!patient) return;

    try {
      const response = await fetch(`/api/patients/${patient.PatNum}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      });

      if (!response.ok) throw new Error('Failed to add note');

      // Refresh patient data to get updated notes
      const updatedPatient = await fetch(`/api/patients/${patient.PatNum}`).then(res => res.json());
      if (!updatedPatient.error) {
        setPatient(updatedPatient);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-scroll scrollbar-stable">
        <SheetHeader className="space-y-0">
          <SheetTitle className="text-left">
            Patient Details
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {/* Header with patient info and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <PatientInitials
                firstName={patient.FName}
                lastName={patient.LName}
                colorIndex={patient.colorIndex}
              />
              <div>
                <h2 className="text-lg font-semibold">
                  {patient.FName} {patient.LName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  #{patient.PatNum} • {getPatientStatus(patient.PatStatus)} • {getPatientGender(patient.Gender)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Contact Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="text-sm font-medium">Address</div>
                      {patient.Address ? (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {(() => {
                            const { street, cityStateZip } = formatAddress(patient.Address);
                            return (
                              <>
                                <div>{street}</div>
                                {cityStateZip && <div>{cityStateZip}</div>}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">Home Number</div>
                      <div className="text-sm text-muted-foreground">{patient.HmPhone || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Birthday</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.Birthdate ? new Date(patient.Birthdate).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Mobile Number</div>
                      <div className="text-sm text-muted-foreground">{patient.WirelessPhone || '-'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{patient.Email || '-'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Appointment Status</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Last appointment</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.appointments && patient.appointments.length > 0 
                          ? (() => {
                              const pastAppts = patient.appointments.filter(
                                apt => new Date(apt.AptDateTime) <= new Date()
                              );
                              return pastAppts.length > 0 
                                ? new Date(pastAppts[pastAppts.length - 1].AptDateTime).toLocaleDateString()
                                : '-';
                            })()
                          : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Due</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.amountDue ? `$${patient.amountDue}` : '-'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium">Next appointment</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.appointments && patient.appointments.length > 0 
                          ? (() => {
                              const futureAppts = patient.appointments.filter(
                                apt => new Date(apt.AptDateTime) > new Date()
                              );
                              return futureAppts.length > 0 
                                ? new Date(futureAppts[0].AptDateTime).toLocaleDateString()
                                : '-';
                            })()
                          : '-'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Insurance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Payer Name</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.insurance?.[0]?.PayerName || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Payer ID</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.insurance?.[0]?.PayerID || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Effective Date</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.insurance?.[0]?.EffectiveDate 
                          ? new Date(patient.insurance[0].EffectiveDate).toLocaleDateString()
                          : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Member ID</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.insurance?.[0]?.MemberID || '-'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Last Appointment Notes Card */}
              {(() => {
                if (!patient.appointments?.length) return null;
                const pastAppts = patient.appointments.filter(
                  apt => new Date(apt.AptDateTime) <= new Date()
                );
                if (!pastAppts.length) return null;
                
                const lastAppt = pastAppts[pastAppts.length - 1];
                return (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-semibold">Last Appointment Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(lastAppt.AptDateTime).toLocaleDateString()}
                        </div>
                        {lastAppt.ProcDescript && (
                          <div className="text-sm">
                            <span className="font-medium">Procedure: </span>
                            <span className="text-muted-foreground">{lastAppt.ProcDescript}</span>
                          </div>
                        )}
                        {lastAppt.Note && (
                          <div className="text-sm">
                            <span className="font-medium">Notes: </span>
                            <span className="text-muted-foreground">{lastAppt.Note}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>

            <TabsContent value="payments">
              {/* Payments tab content will go here */}
            </TabsContent>

            <TabsContent value="notes">
              <PatientNotes
                notes={patient?.notes || []}
                onAddNote={handleAddNote}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
} 