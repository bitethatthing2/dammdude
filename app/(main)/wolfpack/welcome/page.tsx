'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { supabase } from '@/lib/supabase/client';
import { MapPin, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const { user } = useConsistentAuth();
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'requesting'>('loading');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setError('Geolocation is not supported by this browser');
      return;
    }

    try {
      // Check if permission is already granted
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        setLocationStatus('granted');
        // Automatically join the pack if location is already granted
        await joinWolfpack();
      } else if (permission.state === 'denied') {
        setLocationStatus('denied');
        setError('Location permission was denied. Please enable location access in your browser settings.');
      } else {
        setLocationStatus('requesting');
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationStatus('requesting');
    }
  };

  const requestLocationAndJoin = async () => {
    setLocationStatus('requesting');
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });

      console.log('Location obtained:', position.coords);
      setLocationStatus('granted');
      await joinWolfpack();
    } catch (error) {
      console.error('Location error:', error);
      setLocationStatus('denied');
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An error occurred while accessing your location.');
        }
      } else {
        setError('Failed to access location. Please try again.');
      }
    }
  };

  const joinWolfpack = async () => {
    if (!user) {
      setError('Please log in to join the Wolf Pack');
      return;
    }

    setJoinStatus('joining');
    setError(null);

    try {
      // Call the wolfpack join API
      const response = await fetch('/api/wolfpack/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          location: {
            // You can add actual location data here if needed
            latitude: 42.5195, // Salem, MA coordinates as default
            longitude: -70.8967
          }
        })
      });

      if (response.ok) {
        setJoinStatus('success');
        // Redirect to feed after successful join
        setTimeout(() => {
          router.push('/wolfpack/feed');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join Wolf Pack');
      }
    } catch (error) {
      console.error('Error joining wolfpack:', error);
      setJoinStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to join Wolf Pack');
    }
  };

  const getLocationIcon = () => {
    switch (locationStatus) {
      case 'granted':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 'requesting':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      default:
        return <MapPin className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (locationStatus) {
      case 'granted':
        return 'Location access granted!';
      case 'denied':
        return 'Location access denied';
      case 'requesting':
        return 'Requesting location access...';
      default:
        return 'Location access required';
    }
  };

  const getJoinStatusMessage = () => {
    switch (joinStatus) {
      case 'joining':
        return 'Joining the Wolf Pack...';
      case 'success':
        return 'Welcome to the Wolf Pack! Redirecting...';
      case 'error':
        return 'Failed to join Wolf Pack';
      default:
        return '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">Please log in to join the Wolf Pack.</p>
            <Button onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-700">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Welcome to the Wolf Pack</h1>
            <p className="text-gray-400">
              Join the pack and access exclusive content, events, and social features at Side Hustle Bar.
            </p>
          </div>

          {/* Location Status */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              {getLocationIcon()}
              <span className="font-medium">{getStatusMessage()}</span>
            </div>
            
            {locationStatus === 'denied' && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">
                  Location access is required to verify you're at Side Hustle Bar. 
                  Please enable location permissions in your browser settings.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Join Status */}
          {joinStatus !== 'idle' && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {joinStatus === 'joining' && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
                {joinStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                {joinStatus === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
                <span className="font-medium">{getJoinStatusMessage()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {locationStatus === 'requesting' && (
              <Button
                onClick={requestLocationAndJoin}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={joinStatus === 'joining'}
              >
                {joinStatus === 'joining' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Joining Pack...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Allow Location & Join Pack
                  </>
                )}
              </Button>
            )}

            {locationStatus === 'granted' && joinStatus === 'idle' && (
              <Button
                onClick={joinWolfpack}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Join the Wolf Pack
              </Button>
            )}

            {locationStatus === 'denied' && (
              <Button
                onClick={requestLocationAndJoin}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            {joinStatus === 'success' && (
              <Button
                onClick={() => router.push('/wolfpack/feed')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enter Wolf Pack Feed
              </Button>
            )}

            <Button
              onClick={() => router.push('/wolfpack')}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-800"
            >
              Back to Wolf Pack
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}