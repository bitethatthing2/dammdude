'use client';

import { Music, Tv, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

// Accurate business offerings
interface BusinessOffering {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const BUSINESS_OFFERINGS: BusinessOffering[] = [
  {
    id: "sports-entertainment",
    title: "Sports Viewing & UFC Events",
    description: "High-energy sports bar with multiple screens for watching live games, UFC fights, and major sporting events.",
    icon: Tv,
  },
  {
    id: "nightlife",
    title: "Nightclub & Live Entertainment",
    description: "DJ performances, live music events, and high-energy nightlife atmosphere in a 21+ environment.",
    icon: Music,
  },
  {
    id: "mexican-cuisine",
    title: "Authentic Mexican Cuisine",
    description: "Specializing in Baja fish tacos, birria, loaded nachos, loaded fries, and craft cocktails.",
    icon: UtensilsCrossed,
  },
];

export function CommunityInvolvement() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">What We Offer</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the ultimate sports bar and entertainment destination
        </p>
        <Separator className="w-24 h-1 bg-primary mx-auto mt-6" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {BUSINESS_OFFERINGS.map((offering) => {
          const IconComponent = offering.icon;
          return (
            <Card key={offering.id} className="text-center border-none shadow-md">
              <CardContent className="p-8">
                <IconComponent className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">{offering.title}</h3>
                <p className="text-muted-foreground">{offering.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}