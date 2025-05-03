'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
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
} from '@/components/ui/dialog';
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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  QrCode, 
  Check, 
  X, 
  Download 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define table interface
interface Table {
  id: string;
  name: string;
  section: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

// Form schema
const tableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
  section: z.string().optional(),
  active: z.boolean().default(true),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

interface TableManagementProps {
  initialTables: Table[];
}

/**
 * Unified TableManagement component
 * For managing restaurant tables and generating QR codes
 */
export function TableManagement({ initialTables = [] }: TableManagementProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Setup react-hook-form
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: '',
      section: '',
      active: true,
    },
  });
  
  // Function to refresh tables
  const refreshTables = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setTables(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load tables',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open add dialog
  const openAddDialog = () => {
    form.reset({
      name: '',
      section: '',
      active: true,
    });
    setIsAddDialogOpen(true);
  };
  
  // Open edit dialog
  const openEditDialog = (table: Table) => {
    setSelectedTable(table);
    form.reset({
      name: table.name,
      section: table.section || '',
      active: table.active,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open QR code dialog
  const openQrDialog = (table: Table) => {
    setSelectedTable(table);
    setIsQrDialogOpen(true);
  };
  
  // Handle form submission for adding a table
  const onAddSubmit = async (values: TableFormValues) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          name: values.name,
          section: values.section || null,
          active: values.active,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setTables([...tables, data]);
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `Table ${data.name} created successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create table',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission for editing a table
  const onEditSubmit = async (values: TableFormValues) => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .update({
          name: values.name,
          section: values.section || null,
          active: values.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTable.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the table in the local state
      setTables(tables.map(table => 
        table.id === selectedTable.id ? data : table
      ));
      
      setIsEditDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `Table ${data.name} updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update table',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle table deletion
  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
        
      if (error) throw error;
      
      // Remove the table from the local state
      setTables(tables.filter(table => table.id !== tableId));
      
      toast({
        title: 'Success',
        description: 'Table deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete table',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate QR code link for a table
  const getTableQrLink = (tableId: string) => {
    // Base URL will default to the current site
    const baseUrl = window.location.origin;
    return `${baseUrl}/bar-tap?table=${tableId}`;
  };
  
  // Download QR code as PNG
  const downloadQrCode = () => {
    if (!selectedTable) return;
    
    const canvas = document.getElementById('table-qr-canvas') as HTMLCanvasElement;
    
    if (canvas) {
      const link = document.createElement('a');
      link.download = `table-${selectedTable.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Manage Tables</h2>
          <p className="text-muted-foreground">Create, edit, and generate QR codes for tables</p>
        </div>
        
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
          <CardDescription>
            {tables.length} {tables.length === 1 ? 'table' : 'tables'} configured
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No tables configured. Click "Add Table" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tables.map(table => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{table.section || '—'}</TableCell>
                    <TableCell>
                      {table.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openQrDialog(table)}
                          title="Generate QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(table)}
                          title="Edit Table"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTable(table.id)}
                          title="Delete Table"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
        </CardContent>
      </Card>
      
      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table for customer ordering
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Table 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be displayed to customers
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
                      <Input placeholder="e.g. Patio" {...field} />
                    </FormControl>
                    <FormDescription>
                      Group tables by section for easier management
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive tables won't accept orders
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Table'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table details
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Table 1" {...field} />
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
                      <Input placeholder="e.g. Patio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive tables won't accept orders
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
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
              {selectedTable?.name} - Scan to place an order
            </DialogDescription>
          </DialogHeader>
          
          {selectedTable && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                <QRCodeSVG
                  id="table-qr-canvas"
                  value={getTableQrLink(selectedTable.id)}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <p className="text-sm text-center text-muted-foreground mb-4">
                This QR code will direct customers to the ordering page for {selectedTable.name}
              </p>
              
              <Button onClick={downloadQrCode} className="gap-2">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TableManagement;