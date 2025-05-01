"use client";

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode.react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Plus, QrCode, Printer, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface Table {
  id: string;
  name: string;
  section: string | null;
  created_at: string;
  updated_at: string;
}

interface TableManagementProps {
  initialTables: Table[];
}

// Form schema for table form validation
const tableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
  section: z.string().nullable(),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

/**
 * Component for managing tables and generating QR codes
 */
export function TableManagement({ initialTables }: TableManagementProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Set up the form for adding/editing tables
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: '',
      section: '',
    },
  });
  
  // Effect to set base URL for QR codes
  useState(() => {
    // Use window.location on the client side
    if (typeof window !== 'undefined') {
      // Extract just the origin part (protocol + host)
      const url = new URL(window.location.href);
      setBaseUrl(`${url.protocol}//${url.host}`);
    }
  });
  
  // Handle adding a new table
  const handleAddTable = async (values: TableFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          name: values.name,
          section: values.section || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the new table to the list
      setTables([...tables, data as Table]);
      
      // Close the dialog and reset the form
      setIsAddDialogOpen(false);
      form.reset();
      
      toast.success('Table added successfully');
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error adding table:', error);
      toast.error('Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle editing a table
  const handleEditTable = async (values: TableFormValues) => {
    if (!selectedTable) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('tables')
        .update({
          name: values.name,
          section: values.section || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTable.id);
      
      if (error) throw error;
      
      // Update the table in the list
      setTables(tables.map(table => 
        table.id === selectedTable.id
          ? { ...table, name: values.name, section: values.section }
          : table
      ));
      
      // Close the dialog and reset the form
      setIsEditDialogOpen(false);
      form.reset();
      
      toast.success('Table updated successfully');
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a table
  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove the table from the list
      setTables(tables.filter(table => table.id !== id));
      
      toast.success('Table deleted successfully');
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };
  
  // Handle printing a QR code
  const handlePrintQRCode = () => {
    if (!selectedTable) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website');
      return;
    }
    
    // Generate the content for the print window
    const qrCodeUrl = `${baseUrl}/table/${selectedTable.id}`;
    const tableName = selectedTable.name;
    const tableSection = selectedTable.section;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code for Table ${tableName}</title>
          <style>
            body {
              font-family: sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              margin: 0 auto;
              max-width: 300px;
            }
            .table-info {
              margin-top: 10px;
              font-size: 18px;
              font-weight: bold;
            }
            .section-info {
              color: #666;
              font-size: 14px;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${document.getElementById(`qr-${selectedTable.id}`)?.querySelector('canvas')?.toDataURL()}" />
            <div class="table-info">Table ${tableName}</div>
            ${tableSection ? `<div class="section-info">${tableSection}</div>` : ''}
            <div class="instructions">
              Scan the QR code to place your order
            </div>
          </div>
          <div class="no-print" style="margin-top: 30px;">
            <button onclick="window.print();" style="padding: 8px 16px;">Print QR Code</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // Open edit dialog and populate form
  const openEditDialog = (table: Table) => {
    setSelectedTable(table);
    form.reset({
      name: table.name,
      section: table.section || '',
    });
    setIsEditDialogOpen(true);
  };
  
  // Open QR code dialog
  const openQrDialog = (table: Table) => {
    setSelectedTable(table);
    setIsQrDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">All Tables</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Add a new table to your restaurant floor plan.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddTable)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the name or number displayed to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Patio" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Optionally assign this table to a section of your venue.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Table'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {tables.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No tables found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map(table => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{table.section || '-'}</TableCell>
                    <TableCell>
                      <div id={`qr-${table.id}`} className="hidden">
                        <QRCode value={`${baseUrl}/table/${table.id}`} size={150} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openQrDialog(table)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(table)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update this table's information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditTable)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Patio" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table QR Code</DialogTitle>
            <DialogDescription>
              Customers can scan this QR code to place orders at table {selectedTable?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {selectedTable && (
              <>
                <QRCode 
                  value={`${baseUrl}/table/${selectedTable.id}`} 
                  size={200}
                  id={`qr-display-${selectedTable.id}`}
                />
                <p className="mt-4 font-medium">Table {selectedTable.name}</p>
                {selectedTable.section && (
                  <p className="text-sm text-muted-foreground">{selectedTable.section}</p>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePrintQRCode}>
              <Printer className="h-4 w-4 mr-2" />
              Print QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
