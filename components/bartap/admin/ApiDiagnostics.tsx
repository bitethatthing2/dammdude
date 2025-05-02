'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface ApiDiagnosticsProps {
  compact?: boolean;
  className?: string;
}

export function ApiDiagnostics({ compact = false, className = '' }: ApiDiagnosticsProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [result, setResult] = useState<any>(null);
  
  const testEndpoint = async () => {
    setStatus('loading');
    try {
      // Add abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/admin/orders?status=pending', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Read the response as text first
      const text = await response.text();
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(text);
        setResult({
          status: response.status,
          statusText: response.statusText,
          data
        });
      } catch (parseErr) {
        // If JSON parsing fails, return as text
        setResult({
          status: response.status,
          statusText: response.statusText,
          textResponse: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });
      }
      
      setStatus(response.ok ? 'success' : 'error');
    } catch (err) {
      setResult({ 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined 
      });
      setStatus('error');
    }
  };
  
  if (compact) {
    return (
      <div className={`p-4 border rounded-md ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">API Diagnostics</h3>
          <Button 
            onClick={testEndpoint}
            variant="outline"
            size="sm"
            disabled={status === 'loading'}
            className="h-7 px-2"
          >
            {status === 'loading' ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <span className="text-xs">Test API</span>
            )}
          </Button>
        </div>
        
        {status !== 'idle' && (
          <div className="mt-2 text-xs">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium">Status:</span>
              <span className={
                status === 'success' ? 'text-green-500' : 
                status === 'error' ? 'text-red-500' : 
                'text-muted-foreground'
              }>
                {status}
                {result?.status && ` (${result.status})`}
              </span>
            </div>
            {status === 'error' && result?.error && (
              <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-red-600 dark:text-red-400 text-xs overflow-hidden text-ellipsis">
                {result.error}
              </div>
            )}
            {status === 'success' && (
              <div className="text-green-600 dark:text-green-400 text-xs">
                API responded successfully. Found {result?.data?.orders?.length || 0} orders.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">API Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={testEndpoint}
            variant="outline"
            size="sm"
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>Testing API...</span>
              </div>
            ) : (
              <span>Test Orders API</span>
            )}
          </Button>
          
          {status !== 'idle' && (
            <div className="p-3 bg-card rounded text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span className={
                  status === 'success' ? 'text-green-500' : 
                  status === 'error' ? 'text-red-500' : 
                  'text-muted-foreground'
                }>
                  {status}
                  {result?.status && ` (${result.status} ${result.statusText})`}
                </span>
              </div>
              
              {result && (
                <pre className="mt-1 text-xs whitespace-pre-wrap overflow-auto max-h-40 bg-muted p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
              
              {status === 'error' && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-red-500">Troubleshooting Steps:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1">
                    <li>Check your database connection settings</li>
                    <li>Verify table permissions in Supabase</li>
                    <li>Make sure the orders table exists and has the correct schema</li>
                    <li>Check for network or CORS issues</li>
                    <li>Verify your authentication is working properly</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ApiDiagnostics;