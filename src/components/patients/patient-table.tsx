'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientInitials } from "./patient-initials"

// Types based on the original schema
type Patient = {
  PatNum: string
  LName: string | null
  FName: string | null
  Birthdate: Date
  HmPhone: string | null
  WkPhone: string | null
  WirelessPhone: string | null
  Email: string | null
  PatStatus: number
  colorIndex: number
  // Future fields for tags:
  // isActive: boolean
  // hasBalance: boolean
}

type PatientTableProps = {
  patients: Patient[]
  isLoading?: boolean
  totalCount: number
}

export function PatientTable({ 
  patients: initialPatients,
  isLoading = false,
  totalCount
}: PatientTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState(initialPatients)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && patients.length < totalCount) {
          setIsLoadingMore(true)
          try {
            const lastPatient = patients[patients.length - 1]
            const response = await fetch(`/api/patients?cursor=${lastPatient.PatNum}&search=${searchQuery}`)
            const newPatients = await response.json()
            setPatients(prev => [...prev, ...newPatients])
          } catch (error) {
            console.error('Error loading more patients:', error)
          } finally {
            setIsLoadingMore(false)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [patients, isLoadingMore, totalCount, searchQuery])

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      patient.LName?.toLowerCase().includes(searchLower) ||
      patient.FName?.toLowerCase().includes(searchLower)
    )
  })

  // Sort patients by last name by default
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    return (a.LName || '').localeCompare(b.LName || '')
  })

  // Get primary contact number (prioritize wireless -> home -> work)
  const getPrimaryPhone = (patient: Patient) => {
    return patient.WirelessPhone || patient.HmPhone || patient.WkPhone || null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          disabled={isLoading}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Patient Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : sortedPatients.map((patient) => {
              const phoneNumber = getPrimaryPhone(patient)
              return (
                <TableRow key={patient.PatNum}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PatientInitials
                        firstName={patient.FName}
                        lastName={patient.LName}
                        colorIndex={patient.colorIndex}
                      />
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {`${patient.FName || ''} ${patient.LName || ''}`}
                        </span>
                        <div className="flex gap-2">
                          {/* Placeholder for future tags */}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {phoneNumber && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Call patient"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Text patient"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Infinite scroll observer target */}
      <div ref={observerTarget} className="h-4" />
      
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  )
} 