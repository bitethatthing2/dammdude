"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TableData {
  id: string;
  name: string;
  section: string;
}

interface TableDisplayProps {
  tableData: TableData;
}

export function TableDisplay({ tableData }: TableDisplayProps) {
  const router = useRouter();
  const [isNewSession, setIsNewSession] = useState(true);
  
  // Check if this is a new session or returning
  useEffect(() => {
    const lastTableId = localStorage.getItem('last_table_id');
    if (lastTableId === tableData.id) {
      setIsNewSession(false);
    } else {
      localStorage.setItem('last_table_id', tableData.id);
    }
  }, [tableData.id]);
  
  // Handle start ordering action
  const handleStartOrdering = () => {
    router.push(`/menu?table=${tableData.id}`);
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Welcome to Table {tableData.name}</CardTitle>
        <CardDescription className="text-center">
          {tableData.section && `Located in ${tableData.section}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-6 flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">{tableData.name}</span>
          </div>
        </div>
        <p className="text-center text-muted-foreground mt-2">
          {isNewSession 
            ? "Ready to place your order? Tap the button below to continue."
            : "Welcome back! You can continue ordering or view your previous orders."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={handleStartOrdering}
        >
          {isNewSession ? "Start Ordering" : "Continue Ordering"}
        </Button>
        
        {!isNewSession && (
          <Link href={`/orders?table=${tableData.id}`} className="w-full">
            <Button variant="outline" className="w-full">
              View Your Orders
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
