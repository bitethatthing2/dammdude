/**
 * Order page for a specific table with Next.js 15 async params
 */

interface OrderPageProps {
  params: Promise<{
    tableId: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { tableId } = await params;
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Order Page</h1>
      <p>This page has been converted for Next.js 15 compatibility.</p>
      <p>Table ID: {tableId}</p>
    </div>
  );
}
