import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { TableIdentification } from '@/components/bartap/TableIdentification';
import { BackButton } from '@/components/shared/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, QrCode } from 'lucide-react';

export const metadata: Metadata = {
  title: 'BarTap | Side Hustle',
  description: 'Order food and drinks directly from your table',
};

/**
 * BarTap page - Entry point for bar tab functionality
 * Now uses Wolfpack verification instead of QR scanner
 */
export default async function BarTapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Handle search params
  const searchParamsObj = await searchParams;
  const tableParam = searchParamsObj?.table;
  const tableId = typeof tableParam === 'string' ? tableParam : undefined;
  
  // Get cookies
  const cookieStore = await cookies();
  const tableCookie = cookieStore.get('table_id');
  const storedTableId = tableCookie?.value;
  
  // Create Supabase client
  const supabase = await createServerClient(cookieStore);
  
  // If we have a table ID from URL params, this means user came from QR scan or direct link
  // Update the session activity
  const activeTableId = tableId || storedTableId;
  
  if (activeTableId) {
    try {
      await supabase
        .from('active_sessions')
        .upsert({
          table_id: activeTableId,
          last_activity: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton fallbackHref="/" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bar Tab Access</h1>
              <p className="text-muted-foreground">
                Secure ordering for Wolfpack members
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Initializing bar tab access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <TableIdentification />
        </Suspense>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              How Bar Tab Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <p>
                <span className="font-medium text-foreground">Wolfpack Members:</span> Get instant access with membership and location verification
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <p>
                <span className="font-medium text-foreground">Table Service:</span> Manual table entry available for all customers
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <p>
                <span className="font-medium text-foreground">Secure Ordering:</span> All orders are verified and processed securely
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
