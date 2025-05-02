"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function ApiDiagnosticTool() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  const testEndpoints = [
    { name: 'Basic DB Test', url: '/api/admin/test-db' },
    { name: 'Orders API (Pending)', url: '/api/admin/orders?status=pending' },
    { name: 'Orders API (No Filter)', url: '/api/admin/orders' },
    { name: 'Tables API', url: '/api/admin/tables/1' }
  ];
  
  const testEndpoint = async (name: string, url: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const start = Date.now();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const elapsed = Date.now() - start;
      clearTimeout(timeoutId);
      
      let data;
      try {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { parseError: true, text: text.substring(0, 500) + (text.length > 500 ? '...' : '') };
        }
      } catch (e) {
        data = { responseError: true, message: e instanceof Error ? e.message : String(e) };
      }
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          statusText: response.statusText,
          time: elapsed + 'ms',
          data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error instanceof Error ? error.message : String(error)
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };
  
  const testAll = () => {
    testEndpoints.forEach(endpoint => {
      testEndpoint(endpoint.name, endpoint.url);
    });
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">API Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testAll} variant="default">Test All Endpoints</Button>
          {testEndpoints.map(endpoint => (
            <Button 
              key={endpoint.name}
              onClick={() => testEndpoint(endpoint.name, endpoint.url)}
              variant="outline"
              disabled={loading[endpoint.name]}
            >
              {loading[endpoint.name] ? (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </span>
              ) : endpoint.name}
            </Button>
          ))}
        </div>
        
        <div className="space-y-3">
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{name}</h3>
                <div className="flex items-center">
                  {result.status && (
                    <>
                      {result.status >= 200 && result.status < 300 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        result.status >= 200 && result.status < 300 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {result.status}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">{result.time}</span>
                    </>
                  )}
                  {result.error && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Error
                    </span>
                  )}
                </div>
              </div>
              
              {result.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 text-xs rounded">
                  {result.error}
                </div>
              )}
              
              <div className="mt-2">
                <details>
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    View response details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 bg-card p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
              
              {result.status && result.status >= 400 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p className="font-medium text-red-500 dark:text-red-400">Troubleshooting Steps:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1">
                    <li>Check your database connection settings in Supabase</li>
                    <li>Verify table permissions in Supabase (missing RLS policies?)</li>
                    <li>Check if the 'orders' and 'tables' tables exist</li>
                    <li>Examine foreign key constraints between tables</li>
                    <li>Check for network or CORS issues</li>
                    <li>Verify your authentication is working properly</li>
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}