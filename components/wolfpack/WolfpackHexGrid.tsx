'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageCircle, Eye, Heart, UtensilsCrossed, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WolfpackMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  favorite_drink?: string;
  current_vibe?: string;
  looking_for?: string;
  table_location?: string;
  position_x?: number;
  position_y?: number;
  role?: string;
  emoji?: string;
}

interface HexGridProps {
  members: WolfpackMember[];
  currentUserId: string;
  onSendWink: (memberId: string, userId: string) => void;
  onSendMessage?: (userId: string) => void;
}

// Hex grid configuration
const HEX_SIZE = 50;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const GRID_COLS = 8;
const GRID_ROWS = 6;

export default function WolfpackHexGrid({ members, currentUserId, onSendWink, onSendMessage }: HexGridProps) {
  const router = useRouter();
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Calculate hex position
  const getHexPosition = (col: number, row: number) => {
    const x = col * HEX_WIDTH * 0.75;
    const y = row * HEX_HEIGHT + (col % 2 ? HEX_HEIGHT / 2 : 0);
    return { x, y };
  };

  // Get member position on grid
  const getMemberGridPosition = (member: WolfpackMember): { col: number; row: number } => {
    // If member has position data, use it
    if (member.position_x !== undefined && member.position_y !== undefined) {
      return {
        col: Math.floor(member.position_x * GRID_COLS),
        row: Math.floor(member.position_y * GRID_ROWS)
      };
    }
    
    // Otherwise, calculate position based on index
    const index = members.indexOf(member);
    return {
      col: index % GRID_COLS,
      row: Math.floor(index / GRID_COLS)
    };
  };

  // Get role-specific styling
  const getRoleStyle = (role?: string) => {
    switch (role) {
      case 'dj':
        return 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background';
      case 'bartender':
        return 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background';
      case 'host':
        return 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-background';
      default:
        return '';
    }
  };

  const renderHexGrid = () => {
    const hexagons = [];
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const { x, y } = getHexPosition(col, row);
        const key = `hex-${col}-${row}`;
        
        hexagons.push(
          <g key={key} transform={`translate(${x}, ${y})`}>
            <polygon
              points={`
                ${HEX_SIZE},0 
                ${HEX_SIZE/2},-${HEX_HEIGHT/2} 
                ${-HEX_SIZE/2},-${HEX_HEIGHT/2} 
                ${-HEX_SIZE},0 
                ${-HEX_SIZE/2},${HEX_HEIGHT/2} 
                ${HEX_SIZE/2},${HEX_HEIGHT/2}
              `}
              className="fill-slate-800/30 stroke-slate-600/50 hover:fill-slate-700/40 transition-all"
              strokeWidth="1"
            />
          </g>
        );
      }
    }
    
    return hexagons;
  };

  const renderMembers = () => {
    return members.map((member) => {
      const { col, row } = getMemberGridPosition(member);
      const { x, y } = getHexPosition(col, row);
      const isCurrentUser = member.user_id === currentUserId;
      
      return (
        <foreignObject
          key={member.id}
          x={x - 30}
          y={y - 30}
          width="60"
          height="60"
          className="cursor-pointer"
          onMouseEnter={() => setHoveredMember(member.id)}
          onMouseLeave={() => setHoveredMember(null)}
        >
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative w-full h-full">
                <Avatar className={cn(
                  "w-full h-full border-2 transition-all",
                  isCurrentUser ? "border-green-500" : "border-slate-600",
                  getRoleStyle(member.role),
                  hoveredMember === member.id && "scale-110"
                )}>
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {member.emoji || member.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Role indicator */}
                {member.role === 'dj' && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1">
                    <Music className="h-3 w-3 text-white" />
                  </div>
                )}
                {member.role === 'bartender' && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                    <UtensilsCrossed className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </PopoverTrigger>
            
            <PopoverContent className="w-64 p-3" side="top">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{member.display_name}</h4>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  {member.role && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {member.role}
                    </Badge>
                  )}
                </div>
                
                {member.status && (
                  <p className="text-sm text-muted-foreground">{member.status}</p>
                )}
                
                <div className="text-xs space-y-1">
                  {member.favorite_drink && (
                    <p className="flex items-center gap-1">
                      🍹 {member.favorite_drink}
                    </p>
                  )}
                  {member.current_vibe && (
                    <p className="flex items-center gap-1">
                      ✨ {member.current_vibe}
                    </p>
                  )}
                  {member.table_location && (
                    <p className="flex items-center gap-1">
                      📍 {member.table_location}
                    </p>
                  )}
                </div>
                
                {!isCurrentUser && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/wolfpack/profile/${member.user_id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                    {onSendMessage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onSendMessage(member.user_id)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSendWink(member.id, member.user_id)}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {member.role === 'bartender' && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push('/menu')}
                  >
                    <UtensilsCrossed className="h-3 w-3 mr-1" />
                    Food & Drink Menu
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </foreignObject>
      );
    });
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/bar-background.jpg')] opacity-10 bg-cover bg-center" />
      
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Pack View</h3>
          <Badge variant="secondary" className="animate-pulse">
            {members.length} wolves active
          </Badge>
        </div>
        
        <div className="relative overflow-x-auto overflow-y-hidden">
          <svg
            width={GRID_COLS * HEX_WIDTH * 0.75 + HEX_WIDTH * 0.25}
            height={GRID_ROWS * HEX_HEIGHT + HEX_HEIGHT / 2}
            className="min-w-full"
          >
            {/* Render hex grid */}
            <g className="hex-grid">
              {renderHexGrid()}
            </g>
            
            {/* Render members */}
            <g className="members">
              {renderMembers()}
            </g>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>DJ</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Bartender</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-600" />
            <span>Pack Member</span>
          </div>
        </div>
      </div>
    </Card>
  );
}