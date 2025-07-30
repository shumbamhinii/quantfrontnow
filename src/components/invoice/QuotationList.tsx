import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Eye,
  Edit,
  FileText, // For download PDF
  ArrowRight,
  Trash2,
  Loader2,
  Mail, // For email sending
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // For action buttons in dialog
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea'; // For email body
import { Label } from '@/components/ui/label'; // For form labels
import { QuotationForm } from '../invoice/QuotationForm'; // Corrected import path
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { useAuth } from '../../AuthPage'; // Corrected import path for useAuth

// Declare global jspdf if it's loaded via CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

// Define API Base URL
const API_BASE_URL = 'https://quantnow.onrender.com';

// --- Interfaces to match backend API responses for Quotations ---
interface QuotationLineItem {
  id?: string; // Optional for new items
  product_service_id: string | null;
  product_service_name?: string; // For display
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_rate: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string; // From JOIN in backend
  customer_email?: string; // Assuming you might fetch customer email for pre-filling
  quotation_date: string;
  expiry_date: string | null; // Can be null
  total_amount: number; // Ensure this is a number after parsing from DB
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired' | 'Invoiced'; // Match backend enum/status, added 'Invoiced'
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  line_items?: QuotationLineItem[]; // Only present when fetching single quotation
}

interface Customer {
  id: string;
  name: string;
  email: string; // Added email for pre-filling
}

// --- NEW: Invoice interfaces for conversion ---
interface InvoiceLineItem {
  product_service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_rate: number;
}

interface NewInvoicePayload {
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string; // Will need to be calculated
  total_amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'; // Default to 'Draft' or 'Sent'
  currency: string;
  notes: string | null;
  line_items: InvoiceLineItem[];
}

// --- QuotationList Component ---
export function QuotationList() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuotationForm, setShowQuotationForm] = useState(false); // Controls full-screen form visibility
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // For View details (still a modal)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null); // For editing, viewing, or emailing
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null); // State for AlertDialog deletion confirmation
  const [isLoadingList, setIsLoadingList] = useState(true); // Loading state for the quotation list
  const [isFormLoading, setIsFormLoading] = useState(false); // New: Loading state for the form details
  const [isConverting, setIsConverting] = useState(false); // New: Loading state for conversion
  const [isPdfLibLoaded, setIsPdfLibLoaded] = useState(false); // New: State to track PDF library loading

  // States for Email functionality
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false); // Loading state for email sending

  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  // Effect to dynamically load jsPDF and autoTable
  useEffect(() => {
    if (window.jspdf && (window.jspdf.jsPDF.API as any).autoTable) {
      setIsPdfLibLoaded(true);
      return;
    }

    const loadScript = (src: string, id: string, callback: () => void) => {
      if (document.getElementById(id)) {
        callback();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.onload = callback;
      script.onerror = () => {
        console.error(`Failed to load script: ${src}`);
        toast({
          title: 'Script Load Error',
          description: `Failed to load PDF library from ${src}. Please check your network.`,
          variant: 'destructive',
        });
      };
      document.head.appendChild(script);
    };

    // Load jsPDF first
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'jspdf-script',
      () => {
        // Then load autoTable after jsPDF is loaded
        loadScript(
          'https://unpkg.com/jspdf-autotable@3.5.23/dist/jspdf.plugin.autotable.js',
          'jspdf-autotable-script',
          () => {
            setIsPdfLibLoaded(true);
            toast({
              title: 'PDF Library Loaded',
              description: 'PDF generation capabilities are now available.',
            });
          }
        );
      }
    );
  }, [toast]);


  // Function to fetch quotations from the backend
  const fetchQuotations = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for quotations.');
      setQuotations([]);
      setIsLoadingList(false);
      return;
    }

    setIsLoadingList(true); // Start loading
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch quotations');
      }
      const data: Quotation[] = await response.json();
      setQuotations(data.map(quo => ({
        ...quo,
        total_amount: parseFloat(quo.total_amount as any) || 0,
        quotation_date: new Date(quo.quotation_date).toISOString().split('T')[0],
        expiry_date: quo.expiry_date ? new Date(quo.expiry_date).toISOString().split('T')[0] : null,
      })));
    } catch (error: any) {
      console.error('Error fetching quotations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load quotations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingList(false); // End loading
    }
  }, [toast, token]); // Add token to dependencies

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchQuotations();
    } else {
      setQuotations([]);
      setIsLoadingList(false);
    }
  }, [fetchQuotations, isAuthenticated, token]); // Add isAuthenticated and token to dependencies

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-orange-100 text-orange-800';
      case 'Invoiced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuotations = quotations.filter(
    quotation =>
      quotation.status !== 'Invoiced' &&
      (quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewQuotationClick = () => {
    setSelectedQuotation(null);
    setShowQuotationForm(true);
  };

  const handleEditQuotationClick = async (quotation: Quotation) => {
    if (!token) {
      console.warn('No token found. Cannot edit quotation.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to edit quotations.',
        variant: 'destructive',
      });
      return;
    }

    setIsFormLoading(true);
    setShowQuotationForm(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${quotation.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch quotation details for editing.');
      }
      const detailedQuotation: Quotation = await response.json();
      detailedQuotation.total_amount = parseFloat(detailedQuotation.total_amount as any) || 0;
      detailedQuotation.line_items = detailedQuotation.line_items?.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity as any) || 0,
        unit_price: parseFloat(item.unit_price as any) || 0,
        line_total: parseFloat(item.line_total as any) || 0,
        tax_rate: parseFloat(item.tax_rate as any) || 0,
      })) || [];

      setSelectedQuotation(detailedQuotation);
    } catch (error: any) {
      console.error('Error fetching quotation details for edit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load quotation details for editing. Please try again.',
        variant: 'destructive',
      });
      setShowQuotationForm(false);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleViewQuotationClick = async (quotation: Quotation) => {
    if (!token) {
      console.warn('No token found. Cannot view quotation.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to view quotations.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${quotation.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch quotation details');
      }
      const detailedQuotation: Quotation = await response.json();
      detailedQuotation.total_amount = parseFloat(detailedQuotation.total_amount as any) || 0;
      detailedQuotation.line_items = detailedQuotation.line_items?.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity as any) || 0,
        unit_price: parseFloat(item.unit_price as any) || 0,
        line_total: parseFloat(item.line_total as any) || 0,
        tax_rate: parseFloat(item.tax_rate as any) || 0,
      })) || [];

      setSelectedQuotation(detailedQuotation);
      setIsViewModalOpen(true);
    } catch (error: any) {
      console.error('Error fetching quotation details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load quotation details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // --- UPDATED: Handle PDF Download to generate Quotation PDF client-side ---
  const handleDownloadPdf = async (quotation: Quotation) => {
    if (!isPdfLibLoaded || !window.jspdf || !(window.jspdf.jsPDF.API as any).autoTable) {
      toast({
        title: 'PDF Library Not Ready',
        description: 'PDF generation library is still loading or failed to load. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const doc = new window.jspdf.jsPDF();
      let yPos = 20;

      // Set company header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Quantilytix', 14, yPos); // Top left

      // Document Title
      doc.setFontSize(24);
      doc.text('QUOTATION', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 15;

      // Quotation Details (Right aligned)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Quotation #: ${quotation.quotation_number}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 7;
      doc.text(`Date: ${new Date(quotation.quotation_date).toLocaleDateString('en-ZA')}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 7;
      doc.text(`Expiry Date: ${quotation.expiry_date ? new Date(quotation.expiry_date).toLocaleDateString('en-ZA') : 'N/A'}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 15; // Space after quotation details

      // Bill To (Left aligned)
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To:', 14, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(quotation.customer_name, 14, yPos);
      yPos += 7;
      if (quotation.customer_email) {
        doc.text(quotation.customer_email, 14, yPos);
        yPos += 7;
      }
      yPos += 10; // Space before table

      // Line Items Table
      const tableColumn = ['Item', 'Description', 'Qty', 'Unit Price (R)', 'Tax Rate (%)', 'Line Total (R)'];
      const tableRows: any[] = [];
      let subtotal = 0;
      let totalTax = 0;

      quotation.line_items?.forEach(item => {
        const itemTax = item.quantity * item.unit_price * item.tax_rate;
        const itemSubtotal = item.quantity * item.unit_price;
        subtotal += itemSubtotal;
        totalTax += itemTax;

        tableRows.push([
          item.product_service_name || 'Custom Item',
          item.description,
          item.quantity,
          item.unit_price.toFixed(2),
          (item.tax_rate * 100).toFixed(0),
          item.line_total.toFixed(2),
        ]);
      });

      // @ts-ignore - autoTable is a plugin, not directly part of jsPDF's core type definitions
      doc.autoTable({
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [20, 100, 150] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
        },
        didDrawPage: function (data: any) {
          // Footer
          let pageCount = doc.internal.pages.length;
          doc.setFontSize(8);
          doc.text('Page ' + data.pageNumber + ' of ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // Get the final Y position after the table
      yPos = (doc as any).autoTable.previous.finalY + 10;

      // Totals Summary
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Subtotal: R${subtotal.toFixed(2)}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 7;
      doc.text(`Tax: R${totalTax.toFixed(2)}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 7;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL: R${quotation.total_amount.toFixed(2)}`, doc.internal.pageSize.width - 14, yPos, { align: 'right' });
      yPos += 15;

      // Notes
      if (quotation.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 14, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(quotation.notes, 14, yPos, { maxWidth: doc.internal.pageSize.width - 28 });
      }

      doc.save(`Quotation_${quotation.quotation_number}.pdf`);

      toast({
        title: 'Download Started',
        description: `Generating and downloading Quotation ${quotation.quotation_number}.pdf`,
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: error.message || 'Failed to generate quotation PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // --- NEW: Handle Send Email Click (opens dialog) ---
  const handleSendEmailClick = async (quotation: Quotation) => {
    if (!token) {
      console.warn('No token found. Cannot send email.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to send emails.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedQuotation(quotation); // Set the quotation for the email dialog
    // Fetch customer details to pre-fill email if not already available in quotation list
    try {
      const customerResponse = await fetch(`${API_BASE_URL}/api/customers/${quotation.customer_id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (customerResponse.ok) {
        const customerData: Customer = await customerResponse.json();
        setEmailRecipient(customerData.email || ''); // Pre-fill with customer's email
      }
    } catch (error) {
      console.error('Failed to fetch customer email:', error);
      setEmailRecipient(''); // Fallback if customer email cannot be fetched
    }

    setEmailSubject(`Quotation ${quotation.quotation_number} from QxAnalytix`);
    setEmailBody(`Dear ${quotation.customer_name},\n\nPlease find attached your quotation, ${quotation.quotation_number}, for your review.\n\nBest regards,\nQxAnalytix Team`);
    setIsEmailModalOpen(true);
  };

  // --- NEW: Handle Send Email (submits email) ---
  const handleSendEmail = async () => {
    if (!selectedQuotation || !emailRecipient || !emailSubject || !emailBody) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required email fields.',
        variant: 'destructive',
      });
      return;
    }
    if (!token) {
      console.warn('No token found. Cannot send email.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to send emails.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // This endpoint needs to be implemented in your backend for quotations
      // Similar to '/api/invoices/:id/send-pdf-email'
      const response = await fetch(`${API_BASE_URL}/api/quotations/${selectedQuotation.id}/send-pdf-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email.');
      }

      toast({
        title: 'Email Sent',
        description: `Quotation ${selectedQuotation.quotation_number} email sent successfully to ${emailRecipient}.`,
      });
      setIsEmailModalOpen(false); // Close the email dialog
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Email Failed',
        description: error.message || 'Failed to send quotation email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };


  // Function to convert a quotation to an invoice
  const handleConvertToInvoice = async (quotation: Quotation) => {
    if (quotation.status !== 'Accepted') {
      toast({
        title: 'Conversion Not Allowed',
        description: 'Only accepted quotations can be converted to invoices.',
        variant: 'destructive',
      });
      return;
    }
    if (!token) {
      console.warn('No token found. Cannot convert quotation.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to convert quotations.',
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true); // Start conversion loading

    try {
      // Fetch the detailed quotation, including line items, before conversion
      const response = await fetch(`${API_BASE_URL}/api/quotations/${quotation.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch detailed quotation for conversion.');
      }
      const detailedQuotation: Quotation = await response.json();

      console.log('Detailed Quotation fetched for conversion:', detailedQuotation);

      if (!detailedQuotation.line_items || detailedQuotation.line_items.length === 0) {
        throw new Error('Quotation has no line items to convert to an invoice.');
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const newInvoiceNumber = `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;

      const invoiceDate = new Date();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 7);

      const invoicePayload: NewInvoicePayload = {
        invoice_number: newInvoiceNumber,
        customer_id: detailedQuotation.customer_id,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        total_amount: detailedQuotation.total_amount,
        status: 'Draft',
        currency: detailedQuotation.currency,
        notes: `Converted from Quotation ${detailedQuotation.quotation_number}. ${detailedQuotation.notes || ''}`.trim(),
        line_items: detailedQuotation.line_items.map(item => ({
          product_service_id: item.product_service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          tax_rate: item.tax_rate,
        })),
      };

      console.log('Invoice Payload being sent:', invoicePayload);

      const createInvoiceResponse = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!createInvoiceResponse.ok) {
        const errorData = await createInvoiceResponse.json();
        throw new Error(errorData.error || 'Failed to create invoice from quotation.');
      }

      const updateQuotationStatusResponse = await fetch(`${API_BASE_URL}/api/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify({ ...detailedQuotation, status: 'Invoiced' }),
      });

      if (!updateQuotationStatusResponse.ok) {
        const errorData = await updateQuotationStatusResponse.json();
        console.warn(`Failed to update quotation status after conversion: ${errorData.error || 'Unknown error'}`);
      }

      toast({
        title: 'Conversion Successful',
        description: `Quotation ${quotation.quotation_number} converted to Invoice ${newInvoiceNumber}.`,
        variant: 'default',
      });
      fetchQuotations();
    } catch (error: any) {
      console.error('Error converting quotation to invoice:', error);
      toast({
        title: 'Conversion Failed',
        description: error.message || 'Failed to convert quotation to invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const confirmDeleteQuotation = (quotationId: string) => {
    setQuotationToDelete(quotationId);
  };

  const handleDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    if (!token) {
      console.warn('No token found. Cannot delete quotation.');
      toast({
        title: 'Authentication Error',
        description: 'You are not authenticated. Please log in to delete quotations.',
        variant: 'destructive',
      });
      setQuotationToDelete(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${quotationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quotation');
      }
      setQuotations(prev => prev.filter(quo => quo.id !== quotationToDelete));
      toast({
        title: 'Quotation Deleted',
        description: 'The quotation has been successfully deleted.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete quotation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuotationToDelete(null);
    }
  };

  const handleFormSubmitSuccess = () => {
    setShowQuotationForm(false);
    fetchQuotations();
  };

  if (showQuotationForm) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {selectedQuotation ? 'Edit Quotation' : 'Create New Quotation'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {selectedQuotation
              ? `Editing quotation ${selectedQuotation.quotation_number}.`
              : 'Fill in the details to create a new sales quotation.'}
          </p>
          {isFormLoading ? (
            <div className='flex justify-center items-center h-40'>
              <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
              <span className='ml-2 text-gray-600'>Loading quotation details...</span>
            </div>
          ) : (
            <QuotationForm
              quotation={selectedQuotation}
              onClose={() => setShowQuotationForm(false)}
              onSubmitSuccess={handleFormSubmitSuccess}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Quotations
          </CardTitle>
          <Button onClick={handleNewQuotationClick}>
            <Plus className='h-4 w-4 mr-2' />
            New Quotation
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search quotations by number or customer...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {isLoadingList ? (
          <div className='flex justify-center items-center h-40'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
            <span className='ml-2 text-gray-600'>Loading quotations...</span>
          </div>
        ) : (
          <div className='border rounded-lg overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                      No quotations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map(quotation => (
                    <TableRow key={quotation.id}>
                      <TableCell className='font-medium'>{quotation.quotation_number}</TableCell>
                      <TableCell>{quotation.customer_name}</TableCell>
                      <TableCell>{new Date(quotation.quotation_date).toLocaleDateString('en-ZA')}</TableCell>
                      <TableCell>
                        {quotation.expiry_date
                          ? new Date(quotation.expiry_date).toLocaleDateString('en-ZA')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        R
                        {(quotation.total_amount).toLocaleString('en-ZA', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary' className={getStatusColor(quotation.status)}>
                          {quotation.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='sm' onClick={() => handleViewQuotationClick(quotation)}>
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='sm' onClick={() => handleEditQuotationClick(quotation)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          {/* UPDATED: Download PDF Button - disabled if PDF lib not loaded */}
                          <Button
                            variant='ghost'
                            size='sm'
                            title='Download PDF'
                            onClick={() => handleDownloadPdf(quotation)}
                            disabled={!isPdfLibLoaded}
                          >
                            <FileText className='h-4 w-4' />
                          </Button>
                          {/* NEW: Send Email Button */}
                          <Button variant='ghost' size='sm' title='Send Email' onClick={() => handleSendEmailClick(quotation)}>
                            <Mail className='h-4 w-4' />
                          </Button>
                          {quotation.status === 'Accepted' && (
                            <Button
                              variant='ghost'
                              size='sm'
                              title='Convert to Invoice'
                              onClick={() => handleConvertToInvoice(quotation)}
                              disabled={isConverting}
                            >
                              {isConverting ? <Loader2 className='h-4 w-4 animate-spin' /> : <ArrowRight className='h-4 w-4' />}
                            </Button>
                          )}
                          {/* AlertDialog for deletion confirmation */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='ghost' size='sm' onClick={() => confirmDeleteQuotation(quotation.id)}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete quotation {quotation.quotation_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteQuotation}>
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

      {/* View Quotation Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Quotation Details: {selectedQuotation?.quotation_number}</DialogTitle>
            <DialogDescription>Detailed view of the selected quotation.</DialogDescription>
          </DialogHeader>
          {selectedQuotation ? (
            <div className='space-y-4 text-sm'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p>
                    <strong>Customer:</strong> {selectedQuotation.customer_name}
                  </p>
                  <p>
                    <strong>Quotation Date:</strong> {new Date(selectedQuotation.quotation_date).toLocaleDateString('en-ZA')}
                  </p>
                  <p>
                    <strong>Expiry Date:</strong>{' '}
                    {selectedQuotation.expiry_date
                      ? new Date(selectedQuotation.expiry_date).toLocaleDateString('en-ZA')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Status:</strong>{' '}
                    <Badge variant='secondary' className={getStatusColor(selectedQuotation.status)}>
                      {selectedQuotation.status.toUpperCase()}
                    </Badge>
                  </p>
                  <p>
                    <strong>Total Amount:</strong> {selectedQuotation.currency}
                    {(selectedQuotation.total_amount).toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p>
                    <strong>Currency:</strong> {selectedQuotation.currency}
                  </p>
                </div>
              </div>
              {selectedQuotation.notes && (
                <p>
                  <strong>Notes:</strong> {selectedQuotation.notes}
                </p>
              )}

              <h3 className='text-lg font-semibold mt-4'>Line Items</h3>
              <div className='border rounded-lg overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Tax Rate</TableHead>
                      <TableHead>Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.line_items && selectedQuotation.line_items.length > 0 ? (
                      selectedQuotation.line_items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.product_service_name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>R{item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>{(item.tax_rate * 100).toFixed(0)}%</TableCell>
                          <TableCell>R{item.line_total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-4 text-muted-foreground'>
                          No line items for this quotation.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <p>No quotation selected.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Quotation Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Send Quotation Email</DialogTitle>
            <DialogDescription>
              Send quotation {selectedQuotation?.quotation_number} to your customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='emailRecipient' className='text-right'>
                To
              </Label>
              <Input
                id='emailRecipient'
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='emailSubject' className='text-right'>
                Subject
              </Label>
              <Input
                id='emailSubject'
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='emailBody' className='text-right'>
                Body
              </Label>
              <Textarea
                id='emailBody'
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className='col-span-3 min-h-[100px]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Mail className='h-4 w-4 mr-2' />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
