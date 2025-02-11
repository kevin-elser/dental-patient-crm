'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { PatientDetailSidebar } from "./patient-detail-sidebar"

// Types based on the original schema
type Patient = {
  PatNum: string
  LName: string | null
  FName: string | null
  HmPhone: string | null
  WkPhone: string | null
  WirelessPhone: string | null
  Email: string | null
  PatStatus: number
  colorIndex: number
  Gender: number
  Birthdate: Date
  Address: string | null
}

export interface PatientTableProps {
  patients: Patient[];
  totalCount: number;
  isLoading?: boolean;
  extraHeader?: React.ReactNode;
  extraCell?: (patient: Patient) => React.ReactNode;
  onSearchChange?: (search: string) => void;
}

function PatientTableSkeleton({ hasExtraCell = false }: { hasExtraCell?: boolean }) {
  return (
    <TableRow>
      {hasExtraCell && (
        <TableCell className="w-[50px]">
          <Skeleton className="h-4 w-4" />
        </TableCell>
      )}
      <TableCell className="w-[300px]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-[200px]" />
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[200px]">
        <Skeleton className="h-4 w-[100px]" />
      </TableCell>
      <TableCell className="w-[250px]">
        <Skeleton className="h-4 w-[150px]" />
      </TableCell>
      <TableCell className="w-[100px] text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  )
}

export function PatientTable({
  patients: initialPatients,
  totalCount,
  isLoading = false,
  extraHeader,
  extraCell,
  onSearchChange
}: PatientTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const currentPageRef = useRef(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize with initial patients on mount
  useEffect(() => {
    setFilteredPatients(initialPatients)
    setHasMore(initialPatients.length < totalCount)
    currentPageRef.current = 0
  }, [])  // Empty deps array to only run on mount

  // Reset patients and fetch new results when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPatients(initialPatients)
      setHasMore(initialPatients.length < totalCount)
      currentPageRef.current = 0
      return
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const fetchSearchResults = async () => {
      setIsLoadingMore(true)
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(
          `/api/patients?page=0&search=${searchQuery}`,
          { signal: abortControllerRef.current.signal }
        )
        const data = await response.json()
        setFilteredPatients(data.patients)
        setHasMore(data.hasMore)
        currentPageRef.current = 0
        onSearchChange?.(searchQuery)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error searching patients:', error)
        }
      } finally {
        setIsLoadingMore(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchSearchResults()
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchQuery, initialPatients, totalCount, onSearchChange])

  const loadMorePatients = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    abortControllerRef.current = new AbortController()

    try {
      const nextPage = currentPageRef.current + 1
      const response = await fetch(
        `/api/patients?page=${nextPage}&search=${searchQuery}`,
        { signal: abortControllerRef.current.signal }
      )
      const data = await response.json()
      if (data.patients.length > 0) {
        setFilteredPatients(prev => [...prev, ...data.patients])
        setHasMore(data.hasMore)
        currentPageRef.current = nextPage
      } else {
        setHasMore(false)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error loading more patients:', error)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [searchQuery, isLoadingMore, hasMore])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMorePatients()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      observer.disconnect()
    }
  }, [loadMorePatients, hasMore, isLoadingMore])

  // Get primary contact number (prioritize wireless -> home -> work)
  const getPrimaryPhone = (patient: Patient) => {
    return patient.WirelessPhone || patient.HmPhone || patient.WkPhone || null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          disabled={isLoading}
        />
      </div>

      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {extraHeader && <TableHead className="w-[50px]">{extraHeader}</TableHead>}
              <TableHead className="w-[300px]">Patient Name</TableHead>
              <TableHead className="w-[200px]">Phone</TableHead>
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="relative">
            {isLoading ? (
              // Initial loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <PatientTableSkeleton key={`skeleton-${index}`} hasExtraCell={!!extraCell} />
              ))
            ) : (
              filteredPatients.map((patient) => {
                const phoneNumber = getPrimaryPhone(patient)
                return (
                  <TableRow 
                    key={patient.PatNum}
                    onClick={(e) => {
                      // Only trigger if not clicking buttons
                      const target = e.target as HTMLElement
                      if (!target.closest('button')) {
                        setSelectedPatient(patient)
                        setSidebarOpen(true)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {extraCell && (
                      <TableCell className="w-[50px]">
                        {extraCell(patient)}
                      </TableCell>
                    )}
                    <TableCell className="w-[300px]">
                      <div className="flex items-center gap-3">
                        <PatientInitials
                          firstName={patient.FName}
                          lastName={patient.LName}
                          colorIndex={patient.colorIndex}
                        />
                        <div className="font-medium truncate">
                          {patient.FName} {patient.LName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px] truncate">
                      {phoneNumber}
                    </TableCell>
                    <TableCell className="w-[250px] truncate">
                      {patient.Email}
                    </TableCell>
                    <TableCell className="w-[100px] text-right">
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
              })
            )}
            {isLoadingMore && (
              // Loading more skeleton rows
              Array.from({ length: 10 }).map((_, index) => (
                <PatientTableSkeleton key={`loading-more-${index}`} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Infinite scroll observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* Patient Detail Sidebar */}
      <PatientDetailSidebar
        patient={selectedPatient}
        open={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false)
          setSelectedPatient(null)
        }}
      />
    </div>
  )
} 