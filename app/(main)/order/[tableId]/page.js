/**
 * Simple JS version of the order page to avoid TypeScript errors 
 * while fixing import errors in the app
 */
export default function OrderPage({ params }) {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Order Page</h1>
      <p>This page has been simplified while fixing imports.</p>
      <p>Table ID: {params.tableId}</p>
    </div>
  );
}