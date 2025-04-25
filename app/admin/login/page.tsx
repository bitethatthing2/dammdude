"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const Alert = ({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) => (
  <div
    role="alert"
    className={`relative w-full rounded-lg border p-4 ${
      variant === "destructive" 
        ? "border-destructive/50 text-destructive dark:border-destructive" 
        : "bg-background text-foreground"
    } ${className || ""}`}
    {...props}
  />
);

const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`text-sm [&_p]:leading-relaxed ${className || ""}`}
    {...props}
  />
);

export default function AdminLoginPage() {
  const [email, setEmail] = useState('gthabarber1@gmail.com'); // Pre-fill with admin email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Try to pre-authenticate - check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Already authenticated, try to navigate to dashboard
          router.push('/admin/dashboard');
        }
      } catch (err) {
        // Silent fail - user will just see the login form
        console.log('Session check failed:', err);
      }
    };
    
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Sign in with email and password
      const supabase = getSupabaseBrowserClient();
      console.log('Attempting login with:', { email, password: '****' });
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle specific auth errors with user-friendly messages
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password. Please try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email before logging in.');
        } else {
          setError(authError.message);
        }
        console.error('Auth error:', authError);
        
        toast({
          title: "Login Failed",
          description: "Unable to log in with those credentials.",
          variant: "destructive",
          duration: 5000,
        });
        
        setIsLoading(false);
        return;
      }

      console.log('User authenticated, checking admin status');
      
      // Check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (adminError || !adminData) {
        setError('You do not have admin privileges.');
        await supabase.auth.signOut();
        
        toast({
          title: "Access Denied",
          description: "Your account does not have admin privileges.",
          variant: "destructive",
          duration: 5000,
        });
        
        console.error('Admin check error:', adminError);
        setIsLoading(false);
        return;
      }

      console.log('Admin authentication successful');
      
      // Show success message
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
        duration: 3000,
      });

      // Force a short delay to ensure toast is shown before redirect
      setTimeout(() => {
        // Use router.replace instead of push to prevent back button issues
        router.replace('/admin/dashboard');
      }, 500);
      
    } catch (err: any) {
      console.error('Unhandled login error:', err);
      setError(err?.message || 'An unexpected error occurred.');
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground text-center mt-2">
            Contact the administrator if you need access.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
