import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Loader2, // Still useful for a brief visual feedback, but not for async ops
  Download,
  Upload,
  ScanEye,
  File as FileIcon,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';

// Define the Document interface - reverted to local state structure
interface Document {
  id: string;
  name: string;
  type: string; // e.g., "Compliance", "Contract", "Invoice", "Other"
  description?: string;
  uploadDate: string; // ISO string format
  fileUrl?: string; // Temporary URL for local preview (URL.createObjectURL)
  userId: string; // To link documents to users - kept for data structure consistency
}

// Define the form data interface for adding/editing documents
interface DocumentFormData {
  name: string;
  type: string;
  description: string;
}

interface DocumentFormProps {
  document?: Document;
  onSave: (formData: DocumentFormData) => void;
  onCancel: () => void;
  // Removed file-related props from DocumentForm as they are managed in parent for local-only preview
}

// DocumentForm component (simplified for local storage)
function DocumentForm({ document, onSave, onCancel }: DocumentFormProps) {
  const [formData, setFormData] = useState<DocumentFormData>({
    name: document?.name || '',
    type: document?.type || '',
    description: document?.description || '',
  });

  useEffect(() => {
    setFormData({
      name: document?.name || '',
      type: document?.type || '',
      description: document?.description || '',
    });
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <DialogDescription className="sr-only">
        {document ? 'Edit an existing document.' : 'Add a new document.'}
      </DialogDescription>
      <div>
        <Label htmlFor='name'>Document Name *</Label>
        <Input
          id='name'
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor='type'>Document Type *</Label>
        <Input
          id='type'
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value })}
          placeholder='e.g., Compliance, Contract, Invoice'
          required
        />
      </div>
      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>
          {document ? 'Update' : 'Add'} Document
        </Button>
      </DialogFooter>
    </form>
  );
}

// Main DocumentManagement Component
export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>(() => {
    // Initialize with some dummy data for local storage
    const dummyUserId = 'frontend-user-123'; // Dummy user ID for local data
    return [
      {
        id: 'doc1',
        name: 'Company Registration Certificate',
        type: 'Compliance',
        description: 'Official company registration document.',
        uploadDate: new Date('2023-01-15').toISOString(),
        fileUrl: 'https://placehold.co/150x100?text=Doc1', // Placeholder URL
        userId: dummyUserId,
      },
      {
        id: 'doc2',
        name: 'Tax Clearance Certificate',
        type: 'Compliance',
        description: 'Annual tax compliance certificate.',
        uploadDate: new Date('2024-03-01').toISOString(),
        fileUrl: 'https://placehold.co/150x100?text=Doc2',
        userId: dummyUserId,
      },
      {
        id: 'doc3',
        name: 'Client Contract - ABC Corp',
        type: 'Contract',
        description: 'Service agreement with ABC Corporation.',
        uploadDate: new Date('2023-07-20').toISOString(),
        fileUrl: 'https://placehold.co/150x100?text=Doc3',
        userId: dummyUserId,
      },
      {
        id: 'doc4',
        name: 'Invoice #2024001',
        type: 'Invoice',
        description: 'Invoice for services rendered in January 2024.',
        uploadDate: new Date('2024-01-25').toISOString(),
        fileUrl: 'https://placehold.co/150x100?text=Doc4',
        userId: dummyUserId,
      },
    ];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | undefined>();
  const { toast } = useToast();

  // State for file upload and preview (still managed here for drag/drop and preview)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // No isLoading or error states needed for local operations
  const isLoading = false;
  const error = null;

  const handleSaveDocument = useCallback((formData: DocumentFormData) => {
    setDocuments(prevDocuments => {
      if (editingDocument) {
        // Update existing document
        return prevDocuments.map(doc =>
          doc.id === editingDocument.id
            ? {
                ...doc,
                name: formData.name,
                type: formData.type,
                description: formData.description,
                uploadDate: new Date().toISOString(), // Update upload date on edit
                // fileUrl remains as is for existing documents, not updated via form
              }
            : doc
        );
      } else {
        // Add new document
        const newDoc: Document = {
          id: crypto.randomUUID(), // Generate a unique ID for new documents
          name: formData.name,
          type: formData.type,
          description: formData.description,
          uploadDate: new Date().toISOString(),
          // For local storage, fileUrl is a temporary URL or a placeholder
          fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : 'https://placehold.co/150x100?text=NewDoc',
          userId: 'frontend-user-123', // Dummy user ID
        };
        return [...prevDocuments, newDoc];
      }
    });
    toast({ title: `Document ${editingDocument ? 'updated' : 'added'} successfully` });
    setShowForm(false);
    setEditingDocument(undefined);
    setSelectedFile(null); // Clear selected file after saving
    setFilePreviewUrl(null); // Clear preview
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, [editingDocument, toast, selectedFile]);

  const handleDeleteDocument = useCallback((documentId: string) => {
    setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== documentId));
    toast({ title: 'Document deleted successfully' });
  }, [toast]);

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowForm(true);
    // For editing, clear file selection as we don't re-populate file input
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddDocument = () => {
    setEditingDocument(undefined);
    setShowForm(true);
    setSelectedFile(null); // Clear selected file for new document
    setFilePreviewUrl(null); // Clear preview
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  };

  // Client-side filtering based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // File handling for drag and drop / input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setSelectedFile(file);
      // Create a URL for image preview if it's an image
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null); // Clear preview for non-image files
      }
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50'); // Remove drag-over styles
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50'); // Add drag-over styles
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50'); // Remove drag-over styles
  };

  const handleScanDocument = () => {
    toast({
      title: 'Scan Initiated (Placeholder)',
      description: 'This would trigger a document scanning process.',
      variant: 'default',
    });
  };

  const handlePreviewDocument = () => {
    if (!selectedFile && !editingDocument?.fileUrl) { // Check fileUrl for existing docs
      toast({
        title: 'No File Selected',
        description: 'Please select a file or choose an existing document to preview.',
        variant: 'destructive',
      });
      return;
    }

    // Prioritize selected file preview, then existing document's fileUrl
    const urlToPreview = selectedFile ? filePreviewUrl : editingDocument?.fileUrl;

    if (urlToPreview) {
      window.open(urlToPreview, '_blank');
    } else {
      toast({
        title: 'Preview Not Available',
        description: 'Only image previews are supported in this demo. For other files, you would typically download them.',
        variant: 'default',
      });
    }
  };


  return (
    <div className="flex-1 bg-white p-4 md:p-6 lg:p-8">
      <Header title="Document Management">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={handleAddDocument}>
              <Plus className='h-4 w-4 mr-2' />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </DialogTitle>
            </DialogHeader>
            <DocumentForm
              document={editingDocument}
              onSave={handleSaveDocument}
              onCancel={() => setShowForm(false)}
              // Removed file-related props here as DocumentForm no longer needs them for local storage
            />
          </DialogContent>
        </Dialog>
      </Header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-4 mt-4">
        <Card className="flex flex-col">
          <CardContent className='space-y-4 flex-1 flex flex-col p-4'>
            {/* Search Input */}
            <div className='flex items-center gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search documents...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Drag and Drop / Upload Section */}
            <div
              className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-[1.01] cursor-pointer relative'
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()} // Click to open file dialog
            >
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                className='hidden'
              />
              <Upload className='mx-auto h-12 w-12 text-gray-400' />
              <p className='mt-2 text-sm text-gray-600'>Drag and drop files here, or <span className='text-blue-600 font-medium'>click to browse</span></p>
              <p className='mt-1 text-xs text-gray-500'>PDF, Images (JPG, PNG), Documents (DOCX, XLSX)</p>
              {selectedFile && (
                <p className='mt-2 text-sm text-gray-700 flex items-center justify-center'>
                  <FileIcon className='h-4 w-4 mr-2' /> Selected file: <span className='font-semibold ml-1'>{selectedFile.name}</span>
                </p>
              )}
            </div>

            {/* Action Buttons for Uploaded/Scanned Document */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Button
                onClick={handleScanDocument}
                variant='outline'
                className='w-full'
                disabled={!selectedFile}
              >
                <ScanEye className='h-4 w-4 mr-2' /> Scan Document
              </Button>
              <Button
                onClick={handlePreviewDocument}
                variant='outline'
                className='w-full'
                disabled={!selectedFile && !editingDocument?.fileUrl}
              >
                <Eye className='h-4 w-4 mr-2' /> Preview Document
              </Button>
              <Button
                // This button now triggers a local save with default info for the selected file
                onClick={() => {
                  if (selectedFile) {
                    handleSaveDocument({
                      name: selectedFile.name,
                      type: 'Uploaded', // Default type for quick upload
                      description: 'Uploaded via drag and drop',
                    });
                  } else {
                    toast({ title: 'No file selected', description: 'Please select a file to quick upload.', variant: 'destructive' });
                  }
                }}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                disabled={!selectedFile}
              >
                <Upload className='h-4 w-4 mr-2' /> Quick Add Document
              </Button>
            </div>

            {/* Document Table */}
            {isLoading ? ( // isLoading will always be false now
              <div className='flex justify-center items-center flex-1'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
                <span className='ml-2 text-gray-600'>Loading documents...</span>
              </div>
            ) : error ? ( // error will always be null now
              <div className='text-center text-red-500 p-4 border border-red-300 rounded-md flex-1 flex flex-col justify-center items-center'>
                <p>Error: {error}</p>
                <Button onClick={() => setDocuments([])} className='mt-2'>Clear Data</Button> {/* Placeholder retry */}
              </div>
            ) : (
              <div className='border rounded-lg overflow-auto flex-1'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center py-4 text-muted-foreground'>
                          No documents found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className='font-medium'>{doc.name}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>{doc.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{doc.description || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(doc.uploadDate).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              {doc.fileUrl && (
                                <Button variant='ghost' size='sm' onClick={() => window.open(doc.fileUrl, '_blank')}>
                                  <Download className='h-4 w-4' />
                                </Button>
                              )}
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleEditDocument(doc)}
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant='ghost' size='sm'>
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{doc.name}"?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDocument(doc.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
