'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAuthError, getAuthErrorSuggestions, testSupabaseAuth } from '@/lib/auth/debug';

export default function UnifiedLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Diagnostic function to test Supabase connectivity
  const testSupabaseConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      console.log('Supabase connection test:', { data, error });
      return !error;
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      return false;
    }
  };

  // Enhanced validation function
  const validateSignInData = (email: string, password: string): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate input data
    const validationError = validateSignInData(email, password);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up flow
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        console.log('Attempting sign up with email:', email);
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              display_name: displayName,
              full_name: displayName,
            },
          },
        });

        if (error) {
          console.error('Sign up error:', error.message);
          setError(error.message);
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          console.log('Sign up successful - user profile will be created automatically by database trigger');
          
          // Small delay to allow trigger to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          toast({
            title: "Sign Up Successful", 
            description: "Welcome! Please check your email to verify your account.",
          });
          
          // Redirect to main page after successful signup
          router.push('/');
          return;
        }
      } else {
        // Sign in flow
        console.log('Attempting sign in with email:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          // Use enhanced error logging
          logAuthError(error, 'Sign In');
          
          let errorMessage = error.message;
          
          // Handle specific authentication errors with better user guidance
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please double-check your credentials and try again.';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
            
            // Run diagnostic tests when credentials are invalid
            try {
              const [authResult, connectionResult] = await Promise.all([
                testSupabaseAuth(),
                testSupabaseConnection()
              ]);
              
              console.log('🔍 Auth diagnostic test results:', authResult);
              console.log('🔍 Connection test results:', connectionResult);
              
              if (!authResult.success) {
                console.error('🚨 Supabase auth issues detected');
              }
              if (!connectionResult) {
                console.error('🚨 Supabase connection issues detected');
              }
            } catch (diagnosticError) {
              console.error('Diagnostic tests failed:', diagnosticError);
            }
            
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and confirm your account before signing in. Check your spam folder if needed.';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email. Please sign up first or check your email address.';
          } else if (error.message.includes('Database error') || error.message.includes('schema')) {
            errorMessage = 'Database connection issue. Please contact support if this persists.';
            
            // Test connection when database errors occur
            testSupabaseConnection().then(result => {
              if (!result) {
                console.error('🚨 Database connection confirmed to be failing');
              }
            });
            
          } else if (error.message.includes('signup disabled')) {
            errorMessage = 'New user registration is currently disabled. Please contact support.';
          }
          
          // Get helpful suggestions for the user
          const suggestions = getAuthErrorSuggestions(errorMessage);
          if (suggestions.length > 0) {
            console.log('💡 Suggestions for user:', suggestions);
          }
          
          setError(errorMessage);
          toast({
            title: "Sign In Failed",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          console.log('Sign in successful');
          
          // Check if user profile exists in database
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', data.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Error checking user profile:', profileError);
              // Continue with sign in even if profile check fails
            } else if (!userProfile) {
              console.log('User profile not found, creating one...');
              // Create profile for users who signed up before the trigger was fixed
              const displayName = data.user.user_metadata?.display_name || 
                                data.user.user_metadata?.full_name || 
                                data.user.email?.split('@')[0] || 
                                'User';
              
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  auth_id: data.user.id,
                  email: data.user.email || '',
                  first_name: displayName.split(' ')[0] || '',
                  last_name: displayName.split(' ').slice(1).join(' ') || '',
                  display_name: displayName,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (createError) {
                console.error('Error creating user profile:', createError);
                // Don't fail sign in if profile creation fails
              } else {
                console.log('User profile created successfully during sign in');
              }
            } else {
              console.log('User profile found:', userProfile.display_name);
            }
          } catch (profileErr) {
            console.error('Profile check exception:', profileErr);
            // Continue with sign in even if profile operations fail
          }

          toast({
            title: "Sign In Successful",
            description: "Welcome back!",
          });
          
          // Check if user is admin by checking email, metadata, or database role
          const isAdmin = data.user.email === 'gthabarber1@gmail.com' || 
                          data.user.app_metadata?.role === 'admin';
          
          // Redirect based on user type
          if (isAdmin) {
            router.push('/admin/dashboard');
          } else {
            // For regular users, redirect to main page or where they came from
            const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
            router.push(returnUrl || '/');
          }
          return;
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Authentication Error",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4 pb-20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {isSignUp 
              ? 'Join the Wolfpack and start your journey'
              : 'Sign in to your account to continue'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName"
                  type="text" 
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button
                variant="link"
                className="pl-1 text-sm"
                onClick={toggleMode}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}