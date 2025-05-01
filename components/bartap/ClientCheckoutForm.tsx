"use client";

import { CheckoutForm } from './CheckoutForm';
import { BarTapProvider } from '@/lib/contexts/bartap-context';

// Use the TableData interface from the CheckoutForm component
interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface ClientCheckoutFormProps {
  tableData: TableData;
}

export function ClientCheckoutForm({ tableData }: ClientCheckoutFormProps) {
  return (
    <BarTapProvider>
      <CheckoutForm tableData={tableData} />
    </BarTapProvider>
  );
}
