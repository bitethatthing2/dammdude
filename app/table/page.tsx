import { Metadata } from 'next';
import { ManualTableEntry } from '../../components/bartap/ManualTableEntry';
import { QRScanner } from '../../components/bartap/QRScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export const metadata: Metadata = {
  title: 'BarTap - Identify Your Table',
  description: 'Enter your table number or scan your table QR code',
};

/**
 * Table entry page that allows users to either:
 * 1. Manually enter their table number
 * 2. Scan a QR code with their device camera
 */
export default function TableEntryPage() {
  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-4">
        Welcome to BarTap
      </h1>
      
      <p className="text-center text-muted-foreground mb-6">
        Identify your table to begin ordering
      </p>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="manual">Enter Table #</TabsTrigger>
          <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Enter Your Table Number</h2>
            <ManualTableEntry />
          </div>
        </TabsContent>
        
        <TabsContent value="scan">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Scan Your Table's QR Code</h2>
            <QRScanner />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
