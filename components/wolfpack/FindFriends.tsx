'use client';

import { useState, useEffect } from 'react';
import { Search, QrCode, UserPlus, Users, Facebook, ArrowLeft, ChevronRight, Phone, Share2, MoreHorizontal, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';

interface WolfpackUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  is_verified?: boolean;
  mutual_friends?: number;
  is_following?: boolean;
  follower_count?: number;
}

interface FindFriendsProps {
  onClose: () => void;
}

export default function FindFriends({ onClose }: FindFriendsProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<WolfpackUser[]>([]);
  const [searchResults, setSearchResults] = useState<WolfpackUser[]>([]);
  const [contactsCount, setContactsCount] = useState(259);
  const [loading, setLoading] = useState(false);

  // Sample suggested users data
  useEffect(() => {
    const sampleUsers: WolfpackUser[] = [
      {
        id: '1',
        first_name: 'Jonezy',
        last_name: 'Art',
        username: 'JONEZYARTWORK',
        avatar_url: '/icons/wolf-icon-light-screen.png',
        bio: 'Art • Artist for musician @ButtontheBusk...',
        location: 'Salem, OR',
        is_verified: false,
        mutual_friends: 1,
        is_following: false,
        follower_count: 1240
      },
      {
        id: '2',
        first_name: 'Mike',
        last_name: 'Johnson',
        username: 'mike_salem_dj',
        avatar_url: '/icons/wolf-icon-light-screen.png',
        bio: 'DJ • Salem Wolf Pack Leader',
        location: 'Salem, OR',
        is_verified: true,
        mutual_friends: 12,
        is_following: false,
        follower_count: 3500
      },
      {
        id: '3',
        first_name: 'Sarah',
        last_name: 'Martinez',
        username: 'sarah_foodie',
        avatar_url: '/icons/wolf-icon-light-screen.png',
        bio: 'Food blogger • Pack member since 2023',
        location: 'Portland, OR',
        is_verified: false,
        mutual_friends: 8,
        is_following: true,
        follower_count: 842
      }
    ];
    
    setSuggestedUsers(sampleUsers);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual search functionality
      const filtered = suggestedUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    // TODO: Implement follow functionality
    setSuggestedUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, is_following: !user.is_following }
          : user
      )
    );
  };

  const handleQRCode = () => {
    // TODO: Implement QR code functionality
    console.log('Show QR code');
  };

  const handleInviteFriends = () => {
    // TODO: Implement invite friends functionality
    console.log('Invite friends functionality');
  };

  const handleFindContacts = () => {
    // TODO: Implement find contacts functionality
    console.log('Find contacts functionality');
  };

  const handleFindFacebook = () => {
    // TODO: Implement Facebook integration
    console.log('Find Facebook friends functionality');
  };

  const renderUserCard = (user: WolfpackUser) => (
    <div key={user.id} className="bg-gray-50 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <Image
              src={user.avatar_url}
              alt={`${user.first_name} ${user.last_name}`}
              width={48}
              height={48}
              className="rounded-full"
            />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {user.username}
              </h3>
              {user.is_verified && (
                <span className="text-blue-500 text-xs">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {user.bio || `${user.first_name} ${user.last_name}`}
            </p>
            {user.mutual_friends && (
              <p className="text-xs text-gray-400 mt-1 flex items-center">
                <span className="w-4 h-4 bg-gray-400 rounded-full mr-1"></span>
                Friends with {user.mutual_friends}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* User's recent content preview */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg opacity-20"></div>
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
              New
            </div>
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs font-medium rounded-lg py-1"
        >
          Remove
        </Button>
        <Button
          onClick={() => handleFollowUser(user.id)}
          size="sm"
          className={`flex-1 text-xs font-medium rounded-lg py-1 ${
            user.is_following
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {user.is_following ? 'Following' : 'Follow back'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Find friends</h1>
        </div>
        <button className="text-gray-600 hover:text-gray-900">
          <Scan className="h-6 w-6" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          /* Search Results */
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => renderUserCard(user))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found for "{searchQuery}"
              </div>
            )}
          </div>
        ) : (
          /* Main Content */
          <div className="p-4">
            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleQRCode}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Use QR code</h3>
                    <p className="text-sm text-gray-500">Show or scan each other's QR codes.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={handleInviteFriends}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Invite friends</h3>
                    <p className="text-sm text-gray-500">Share your profile to connect.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={handleFindContacts}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Find contacts</h3>
                    <p className="text-sm text-gray-500">Sync or find contacts.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{contactsCount}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>

              <button
                onClick={handleFindFacebook}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Find Facebook friends</h3>
                    <p className="text-sm text-gray-500">Sync or find Facebook friends.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* New suggested account */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">1 new suggested account</p>
              {suggestedUsers.slice(0, 1).map(user => renderUserCard(user))}
            </div>

            {/* Suggested Accounts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Suggested accounts</h2>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  See all
                </button>
              </div>
              
              {suggestedUsers.slice(1).map(user => renderUserCard(user))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}