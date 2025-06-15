import { Metadata } from 'next';
import { ManualTableEntry } from '@/components/bartap/ManualTableEntry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'BarTap - Table Access',
  description: 'Access bar tab ordering for your table',
};

/**
 * Table entry page that provides table access options
 * Now integrated with Wolfpack verification system
 */
export default function TableEntryPage() {
  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            BarTap Access
          </h1>
        </div>
        
        <p className="text-muted-foreground">
          Choose how you&apos;d like to access our ordering system
        </p>
      </div>
      
      {/* Wolfpack Members - Preferred Option */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Wolfpack Members
          </CardTitle>
          <CardDescription>
            Get instant access with membership verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/bar-tap">
            <Button className="w-full" size="lg">
              Access with Wolfpack Membership
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Manual Table Entry - Fallback Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual Table Entry</CardTitle>
          <CardDescription>
            Enter your table number directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualTableEntry />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Need help?</p>
              <p>
                Wolfpack members enjoy faster access and exclusive benefits. 
                Not a member yet? Ask your server about joining today!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
