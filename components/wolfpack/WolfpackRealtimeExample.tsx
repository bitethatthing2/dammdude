// components/WolfpackRealtimeExample.tsx
// Example component showing how to use the fixed realtime system

import React, { useState } from 'react'
// import { useWolfpackRealtimeFixed } from '@/hooks/useWolfpackRealtime' // DISABLED: Hook removed during schema migration

interface WolfpackRealtimeExampleProps {
  locationId: string
}

export function WolfpackRealtimeExample({ locationId }: WolfpackRealtimeExampleProps) {
  const [joinData, setJoinData] = useState({
    displayName: '',
    emoji: '🐺',
    currentVibe: '',
    favoriteDrink: '',
    lookingFor: '',
    instagramHandle: ''
  })

  const { state, actions } = useWolfpackRealtimeFixed({
    locationId,
    autoConnect: true,
    enableDebugLogging: true // Enable for debugging
  })

  const handleJoin = async () => {
    const success = await actions.joinPack(joinData)
    if (success) {
      console.log('✅ Successfully joined the wolfpack!')
    }
  }

  const handleLeave = async () => {
    const success = await actions.leavePack()
    if (success) {
      console.log('✅ Successfully left the wolfpack!')
    }
  }

  const handleUpdateProfile = async () => {
    const success = await actions.updateProfile({
      currentVibe: 'Updated vibe! 🎉',
      bio: 'This is my updated bio'
    })
    if (success) {
      console.log('✅ Successfully updated profile!')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wolfpack Realtime Demo</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center gap-2 mb-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              state.status === 'connected' ? 'bg-green-500' : 
              state.status === 'connecting' ? 'bg-yellow-500' : 
              state.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}
          />
          <span className="capitalize">{state.status}</span>
          {state.isLoading && <span className="text-sm text-gray-500">(Loading...)</span>}
        </div>
        
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
            <div className="flex justify-between items-center">
              <span className="text-red-800">{state.error}</span>
              <button
                onClick={actions.clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={actions.connect}
            disabled={state.status === 'connected' || state.isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Connect
          </button>
          <button
            onClick={actions.disconnect}
            disabled={state.status === 'disconnected'}
            className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            Disconnect
          </button>
          <button
            onClick={actions.refresh}
            disabled={state.isLoading}
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Current User */}
      {state.currentUser && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <div className="space-y-1">
            <p><strong>Name:</strong> {state.currentUser.first_name} {state.currentUser.last_name}</p>
            <p><strong>Email:</strong> {state.currentUser.email}</p>
            <p><strong>Status:</strong> {state.currentUser.wolfpack_status}</p>
            {state.currentUser.wolf_profile && (
              <>
                <p><strong>Display Name:</strong> {state.currentUser.wolf_profile.display_name}</p>
                <p><strong>Vibe:</strong> {state.currentUser.wolf_profile.vibe_status}</p>
                <p><strong>Emoji:</strong> {state.currentUser.wolf_profile.wolf_emoji}</p>
              </>
            )}
          </div>
          
          <button
            onClick={handleUpdateProfile}
            disabled={state.isLoading}
            className="mt-2 px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            Update Profile
          </button>
        </div>
      )}

      {/* Membership Status */}
      {state.membershipStatus && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Membership Status</h2>
          <div className="space-y-1">
            <p><strong>Is Member:</strong> {state.membershipStatus.isMember ? 'Yes' : 'No'}</p>
            {state.membershipStatus.isMember && (
              <>
                <p><strong>Status:</strong> {state.membershipStatus.status}</p>
                <p><strong>Joined:</strong> {new Date(state.membershipStatus.joinedAt!).toLocaleString()}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Join/Leave Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Wolfpack Actions</h2>
        
        {!state.membershipStatus?.isMember ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Display Name"
                value={joinData.displayName}
                onChange={(e) => setJoinData(prev => ({ ...prev, displayName: e.target.value }))}
                className="px-3 py-1 border rounded"
              />
              <input
                type="text"
                placeholder="Emoji"
                value={joinData.emoji}
                onChange={(e) => setJoinData(prev => ({ ...prev, emoji: e.target.value }))}
                className="px-3 py-1 border rounded"
              />
              <input
                type="text"
                placeholder="Current Vibe"
                value={joinData.currentVibe}
                onChange={(e) => setJoinData(prev => ({ ...prev, currentVibe: e.target.value }))}
                className="px-3 py-1 border rounded"
              />
              <input
                type="text"
                placeholder="Favorite Drink"
                value={joinData.favoriteDrink}
                onChange={(e) => setJoinData(prev => ({ ...prev, favoriteDrink: e.target.value }))}
                className="px-3 py-1 border rounded"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={state.isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {state.isLoading ? 'Joining...' : 'Join Wolfpack'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleLeave}
            disabled={state.isLoading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            {state.isLoading ? 'Leaving...' : 'Leave Wolfpack'}
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Wolfpack Members ({state.memberCount})
          </h2>
          <div className="text-sm text-gray-600">
            Online: {state.onlineCount}
          </div>
        </div>
        
        {state.members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No wolfpack members found. Join the pack to see other members!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.members.map((member: any) => (
              <MemberCard 
                key={member.id} 
                member={member}
                isCurrentUser={member.id === state.currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Member Card Component
interface MemberCardProps {
  member: any // RealtimeUser
  isCurrentUser: boolean
}

function MemberCard({ member, isCurrentUser }: MemberCardProps) {
  const displayName = member.wolf_profile?.display_name || 
                     `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                     member.email

  const emoji = member.wolf_profile?.wolf_emoji || '🐺'
  const vibe = member.wolf_profile?.vibe_status || 'No status'
  const isOnline = member.is_wolfpack_member && member.wolfpack_status === 'active'

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt="Avatar"
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl">{emoji}</span>
            </div>
          )}
          
          {/* Online indicator */}
          <div 
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">
            {displayName}
            {isCurrentUser && <span className="text-blue-600 ml-1">(You)</span>}
          </h4>
          <p className="text-sm text-gray-500 truncate">{vibe}</p>
        </div>
      </div>
      
      {/* Member details */}
      <div className="space-y-1 text-sm">
        {member.wolf_profile?.favorite_drink && (
          <p className="text-gray-600">
            <span className="font-medium">Drink:</span> {member.wolf_profile.favorite_drink}
          </p>
        )}
        
        {member.wolf_profile?.looking_for && (
          <p className="text-gray-600">
            <span className="font-medium">Looking for:</span> {member.wolf_profile.looking_for}
          </p>
        )}
        
        {member.wolf_profile?.instagram_handle && (
          <p className="text-gray-600">
            <span className="font-medium">Instagram:</span> @{member.wolf_profile.instagram_handle}
          </p>
        )}
      </div>
      
      {/* Status badges */}
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          member.wolfpack_status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {member.wolfpack_status}
        </span>
        
        {member.wolfpack_tier && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            {member.wolfpack_tier}
          </span>
        )}
        
        {member.is_permanent_pack_member && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
            Permanent
          </span>
        )}
      </div>
      
      {/* Bio if available */}
      {member.wolf_profile?.bio && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {member.wolf_profile.bio}
        </p>
      )}
      
      {/* Last active */}
      {member.wolfpack_joined_at && (
        <p className="text-xs text-gray-400 mt-2">
          Joined: {new Date(member.wolfpack_joined_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}