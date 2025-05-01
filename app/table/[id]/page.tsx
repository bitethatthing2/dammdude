import { TableIdentification } from '@/components/bartap/TableIdentification';
import { Metadata } from 'next';

interface TablePageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'BarTap - Table Identification',
  description: 'Order food and drinks right from your table',
};

/**
 * Page component for table identification via QR code
 * This page is accessed when a customer scans a QR code at their table
 */
export default function TablePage({ params }: TablePageProps) {
  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Welcome to BarTap
      </h1>
      
      <TableIdentification tableId={params.id} />
    </div>
  );
}
