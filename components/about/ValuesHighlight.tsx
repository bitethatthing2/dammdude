"use client";

import { 
  Award, 
  Utensils, 
  HeartHandshake, 
  Tv, 
  Users, 
  ThumbsUp
} from "lucide-react";
import { CoreValue } from "@/lib/types/about";
import { Card, CardContent } from "@/components/ui/card";

// Map of icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  award: <Award className="h-6 w-6" />,
  utensils: <Utensils className="h-6 w-6" />,
  heartHandshake: <HeartHandshake className="h-6 w-6" />,
  tv: <Tv className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  thumbsUp: <ThumbsUp className="h-6 w-6" />,
};

// Core values data
const CORE_VALUES: CoreValue[] = [
  {
    id: "quality",
    title: "Quality Experience",
    description: "We're committed to excellence in every aspect, from our carefully crafted menu to our premium viewing experience.",
    icon: "award"
  },
  {
    id: "food",
    title: "Elevated Food & Drink",
    description: "Our culinary offerings go far beyond standard bar fare, featuring locally-sourced ingredients and craft beverages.",
    icon: "utensils"
  },
  {
    id: "community",
    title: "Community Focus",
    description: "We're proud to be an active member of our community, supporting local causes and bringing people together.",
    icon: "heartHandshake"
  },
  {
    id: "sports",
    title: "Sports Passion",
    description: "Our genuine love for sports drives everything we do, creating an authentic atmosphere for true fans.",
    icon: "tv"
  },
  {
    id: "inclusion",
    title: "Inclusive Environment",
    description: "We welcome fans of all teams, creating a space where everyone can enjoy the game regardless of who they support.",
    icon: "users"
  },
  {
    id: "service",
    title: "Exceptional Service",
    description: "Our staff is dedicated to providing attentive, knowledgeable service that enhances your experience.",
    icon: "thumbsUp"
  }
];

export function ValuesHighlight() {
  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Our Core Values</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          These principles guide everything we do, from how we prepare your food to how we create the perfect game-day atmosphere.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CORE_VALUES.map((value) => (
          <Card 
            key={value.id}
            className="border border-border/40 transition-all duration-300 hover:shadow-md hover:border-primary/20"
          >
            <CardContent className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {ICON_MAP[value.icon]}
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}