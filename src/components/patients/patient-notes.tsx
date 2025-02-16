import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddNoteModal } from "./add-note-modal"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
}

interface PatientNotesProps {
  notes: Note[]
  onAddNote: (note: { title: string; content: string }) => void
}

export function PatientNotes({ notes, onAddNote }: PatientNotesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openNoteId, setOpenNoteId] = useState<number | null>(null)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {notes.length} notes
        </CardTitle>
        <Button
          variant="outline"
          className="text-xs"
          onClick={() => setIsModalOpen(true)}
        >
          Add note
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {notes.map((note) => (
          <Collapsible
            key={note.id}
            open={openNoteId === note.id}
            onOpenChange={() =>
              setOpenNoteId(openNoteId === note.id ? null : note.id)
            }
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openNoteId === note.id ? "rotate-180" : ""
                  }`}
                />
                {note.title}
              </CollapsibleTrigger>
              <span className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md bg-muted px-4 py-3 text-sm">
                {note.content}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
      <AddNoteModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(note) => {
          onAddNote(note)
          setIsModalOpen(false)
        }}
      />
    </Card>
  )
} 