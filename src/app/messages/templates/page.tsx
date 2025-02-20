'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";

const templateTags = [
  { id: 'firstName', label: 'First Name', value: '{{firstName}}' },
  { id: 'lastName', label: 'Last Name', value: '{{lastName}}' },
  { id: 'preferredName', label: 'Preferred Name', value: '{{preferredName}}' },
  { id: 'practiceName', label: 'Practice Name', value: '{{practiceName}}' },
  { id: 'practicePhone', label: 'Practice Phone', value: '{{practicePhone}}' },
];

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export default function TemplatesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tagValue: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newContent = before + tagValue + after;
      setContent(newContent);

      // Reset cursor position after the inserted tag
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tagValue.length;
      }, 0);
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setContent(template.content);
    setIsOpen(true);
  };

  const handleDelete = async (template: MessageTemplate) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');
      
      setTemplates(prev => prev.filter(t => t.id !== template.id));
    } catch (error) {
      console.error('Error deleting template:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setDeleteTemplate(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}` 
        : '/api/templates';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error(
        editingTemplate ? 'Failed to update template' : 'Failed to create template'
      );
      
      const updatedTemplate = await response.json();
      
      setTemplates(prev => {
        if (editingTemplate) {
          return prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t);
        }
        return [updatedTemplate, ...prev];
      });

      setIsOpen(false);
      setTitle('');
      setContent('');
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      // TODO: Add proper error handling/notification
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setTitle('');
      setContent('');
      setEditingTemplate(null);
    }
    setIsOpen(open);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Message Templates</h1>
        <Dialog open={isOpen} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Template Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  id="template-content"
                  placeholder="Template Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {templateTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleTagClick(tag.value)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search templates..."
            className="w-full"
            type="search"
          />
        </div>

        <div className="rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="w-[300px]">
                      <Skeleton className="h-5 w-[200px]" />
                    </TableCell>
                    <TableCell className="min-w-[500px]">
                      <Skeleton className="h-5 w-[400px]" />
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <Skeleton className="h-5 w-[100px]" />
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No templates found</TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="w-[300px]">{template.title}</TableCell>
                    <TableCell className="min-w-[500px]">{template.content}</TableCell>
                    <TableCell className="w-[200px]">{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="w-[100px] text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => setDeleteTemplate(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteTemplate} onOpenChange={(open) => !open && setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template "{deleteTemplate?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplate && handleDelete(deleteTemplate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 