"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { captureError } from '@/lib/utils/error-utils';
import {
  Card,
  CardContent,
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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Pencil, Plus, QrCode, Printer, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Table interface matching your Supabase schema
interface TableRecord {
  id: string;
  name: string;
  section: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface TableManagementProps {
  initialTables: TableRecord[];
}

// Form schema for table form validation
const tableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50, 'Table name too long'),
  section: z.string().max(50, 'Section name too long').nullable().transform(val => val || null),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

// Error type for Supabase errors
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Component for managing tables and generating QR codes
 */
export function TableManagement({ initialTables }: TableManagementProps) {
  const [tables, setTables] = useState<TableRecord[]>(initialTables);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  
  const router = useRouter();
  const supabase = createClient();
  
  // Set up the form for adding/editing tables
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: '',
      section: null,
    },
  });
  
  // Effect to set base URL for QR codes
  useEffect(() => {
    // Use window.location on the client side
    if (typeof window !== 'undefined') {
      // Extract just the origin part (protocol + host)
      const url = new URL(window.location.href);
      setBaseUrl(`${url.protocol}//${url.host}`);
    }
  }, []);
  
  // Handle adding a new table
  const handleAddTable = async (values: TableFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          name: values.name,
          section: values.section,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from insert operation');
      }
      
      // Add the new table to the list
      setTables([...tables, data as TableRecord]);
      
      // Close the dialog and reset the form
      setIsAddDialogOpen(false);
      form.reset();
      
      toast({
        title: "Success",
        description: "Table added successfully",
      });
      
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error adding table:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as SupabaseError)?.message || 'Unknown error occurred';
      
      // Log error to tracking system
      captureError(new Error(errorMessage), {
        source: 'TableManagement',
        context: { 
          action: 'addTable',
          values,
          originalError: error
        }
      });
      
      toast({
        title: "Error",
        description: `Failed to add table: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle editing a table
  const handleEditTable = async (values: TableFormValues) => {
    if (!selectedTable) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .update({
          name: values.name,
          section: values.section,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTable.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from update operation');
      }
      
      // Update the table in the list
      setTables(tables.map(table => 
        table.id === selectedTable.id
          ? { ...table, name: values.name, section: values.section }
          : table
      ));
      
      // Close the dialog and reset the form
      setIsEditDialogOpen(false);
      form.reset();
      setSelectedTable(null);
      
      toast({
        title: "Success",
        description: "Table updated successfully",
      });
      
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error updating table:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as SupabaseError)?.message || 'Unknown error occurred';
      
      // Log error to tracking system
      captureError(new Error(errorMessage), {
        source: 'TableManagement',
        context: { 
          action: 'editTable',
          tableId: selectedTable.id,
          values,
          originalError: error
        }
      });
      
      toast({
        title: "Error",
        description: `Failed to update table: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a table
  const handleDeleteTable = async (id: string) => {
    const tableToDelete = tables.find(t => t.id === id);
    
    if (!confirm(`Are you sure you want to delete table "${tableToDelete?.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Remove the table from the list
      setTables(tables.filter(table => table.id !== id));
      
      toast({
        title: "Success",
        description: "Table deleted successfully",
      });
      
      router.refresh(); // Refresh server data
    } catch (error) {
      console.error('Error deleting table:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as SupabaseError)?.message || 'Unknown error occurred';
      
      // Log error to tracking system
      captureError(new Error(errorMessage), {
        source: 'TableManagement',
        context: { 
          action: 'deleteTable',
          tableId: id,
          originalError: error
        }
      });
      
      toast({
        title: "Error",
        description: `Failed to delete table: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle printing a QR code
  const handlePrintQRCode = () => {
    if (!selectedTable) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups for this website to print QR codes",
        variant: "destructive",
      });
      return;
    }
    
    // Get the QR code canvas element
    const qrCanvas = document.getElementById(`qr-display-${selectedTable.id}`)?.querySelector('canvas');
    if (!qrCanvas) {
      toast({
        title: "Error",
        description: "Could not generate QR code for printing",
        variant: "destructive",
      });
      printWindow.close();
      return;
    }
    
    // Generate the content for the print window
    const qrCodeDataUrl = qrCanvas.toDataURL();
    const tableName = selectedTable.name;
    const tableSection = selectedTable.section;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${tableName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              padding: 40px 20px;
              margin: 0;
            }
            .qr-container {
              margin: 0 auto;
              max-width: 400px;
              padding: 30px;
              border: 2px solid #e5e5e5;
              border-radius: 10px;
            }
            .qr-code {
              margin: 0 auto 20px;
              display: block;
            }
            .table-info {
              margin-top: 20px;
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .section-info {
              color: #666;
              font-size: 18px;
              margin-top: 5px;
            }
            .instructions {
              margin-top: 30px;
              font-size: 16px;
              color: #666;
              line-height: 1.5;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
            }
            .logo {
              margin-bottom: 20px;
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="logo">BarTap</div>
            <img src="${qrCodeDataUrl}" class="qr-code" width="250" height="250" />
            <div class="table-info">${tableName}</div>
            ${tableSection ? `<div class="section-info">${tableSection}</div>` : ''}
            <div class="instructions">
              Scan this QR code with your phone to view our menu and place your order
            </div>
          </div>
          <div class="no-print" style="margin-top: 40px;">
            <button onclick="window.print();" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Print QR Code
            </button>
            <button onclick="window.close();" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto-focus the print window
    printWindow.focus();
  };
  
  // Open edit dialog and populate form
  const openEditDialog = (table: TableRecord) => {
    setSelectedTable(table);
    form.reset({
      name: table.name,
      section: table.section,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open QR code dialog
  const openQrDialog = (table: TableRecord) => {
    try {
      setSelectedTable(table);
      setIsQrDialogOpen(true);
    } catch (error) {
      console.error('Error opening QR dialog:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
      
      captureError(new Error(errorMessage), {
        source: 'TableManagement',
        context: { 
          action: 'openQrDialog',
          tableId: table.id,
          originalError: error
        }
      });
      
      toast({
        title: "Error",
        description: "Failed to open QR code dialog",
        variant: "destructive",
      });
    }
  };
  
  // Sort tables by section, then by name
  const sortedTables = [...tables].sort((a, b) => {
    if (a.section === b.section) {
      return a.name.localeCompare(b.name);
    }
    if (!a.section) return 1;
    if (!b.section) return -1;
    return a.section.localeCompare(b.section);
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Table Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your venue&#39;s tables and generate QR codes for ordering
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Create a new table for your venue. Tables can be assigned to sections.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleAddTable)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Table 1, A1, Booth 3" 
                        {...field} 
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      A unique name to identify this table
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
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Patio, Main Floor, VIP" 
                        {...field} 
                        value={field.value || ''} 
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Group tables by area or section
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Table'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {sortedTables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tables found</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Table
              </Button>
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
                {sortedTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {table.section || '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openQrDialog(table)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(table)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit {table.name}</span>
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {table.name}</span>
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          form.reset();
          setSelectedTable(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update the details for {selectedTable?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleEditTable)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Table 1, A1, Booth 3" 
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify this table
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
                  <FormLabel>Section</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Patio, Main Floor, VIP" 
                      {...field} 
                      value={field.value || ''}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Group tables by area or section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  form.reset();
                  setSelectedTable(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Table'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={(open) => {
        setIsQrDialogOpen(open);
        if (!open) {
          setSelectedTable(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Table QR Code</DialogTitle>
            <DialogDescription>
              Customers can scan this QR code to place orders at {selectedTable?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            {selectedTable && baseUrl && (
              <>
                <div 
                  id={`qr-display-${selectedTable.id}`}
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <QRCodeSVG 
                    value={`${baseUrl}/table/${selectedTable.id}`} 
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="font-semibold text-lg">{selectedTable.name}</p>
                  {selectedTable.section && (
                    <p className="text-sm text-muted-foreground">{selectedTable.section}</p>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Place this QR code on the table for customers to scan and order
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsQrDialogOpen(false);
                setSelectedTable(null);
              }}
            >
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