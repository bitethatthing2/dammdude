"use client";

import Image from "next/image";
import { HeartHandshake } from "lucide-react";
import { useLocationState } from "@/lib/hooks/useLocationState";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

// Community involvement data
interface CommunityInitiative {
  id: string;
  title: string;
  description: string;
  image: string;
  location_id: 'salem' | 'portland' | 'both';
}

const COMMUNITY_INITIATIVES: CommunityInitiative[] = [
  {
    id: "youth-sports",
    title: "Youth Sports Sponsorship",
    description: "We proudly sponsor local youth sports teams, providing uniforms, equipment, and facilities for practices and team events.",
    image: "/images/about/community-youth-sports.jpg",
    location_id: "both",
  },
  {
    id: "fundraisers",
    title: "Charity Game Nights",
    description: "Monthly charity events where a percentage of all sales goes to support local organizations and causes.",
    image: "/images/about/community-charity.jpg",
    location_id: "both",
  },
  {
    id: "food-drive",
    title: "Annual Food Drive",
    description: "Our season-long food drive collects thousands of pounds of food for local food banks and shelters.",
    image: "/images/about/community-food-drive.jpg",
    location_id: "salem",
  },
  {
    id: "cleanup",
    title: "Portland Cleanup Initiative",
    description: "Quarterly neighborhood cleanup events where our staff and customers work together to beautify our community.",
    image: "/images/about/community-cleanup.jpg",
    location_id: "portland",
  },
];

export function CommunityInvolvement() {
  const { location } = useLocationState();
  
  // Filter initiatives based on location
  const filteredInitiatives = COMMUNITY_INITIATIVES.filter(initiative => 
    initiative.location_id === location || initiative.location_id === "both"
  );
  
  if (filteredInitiatives.length === 0) {
    return null;
  }
  
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <HeartHandshake className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Community Involvement</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
           {location === "portland" ? "Portland" : "Salem"}
        </p>
        <Separator className="w-24 h-1 bg-primary mx-auto mt-6" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredInitiatives.map((initiative) => (
          <Card key={initiative.id} className="overflow-hidden border-none shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-0">
              {/* Image section */}
              <div className="relative h-60 sm:h-full sm:col-span-2">
                <Image 
                  src={initiative.image} 
                  alt={initiative.title}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 100vw, 40vw"
                />
              </div>
              
              {/* Content section */}
              <CardContent className="p-6 sm:col-span-3 flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-3">{initiative.title}</h3>
                <p className="text-muted-foreground">{initiative.description}</p>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}