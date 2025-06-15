import { WolfpackVerification } from '@/components/bartap/WolfpackVerification';

interface TableIdentificationProps {
  tableId?: string;
}

/**
 * Server component that handles Wolfpack-based bar tab access
 * Replaces QR code scanning with membership and location verification
 */
export async function TableIdentification({ tableId }: TableIdentificationProps) {
  // For Wolfpack implementation, we bypass traditional table identification
  // and use membership + location verification instead
  return <WolfpackVerification />;
}
