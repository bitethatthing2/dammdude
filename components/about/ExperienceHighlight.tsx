'use client';

import Image from "next/image";
import { useLocationState } from "@/lib/hooks/useLocationState";
import { 
  MonitorPlay, 
  UtensilsCrossed, 
  Beer, 
  Tv, 
  Speaker, 
  Trophy
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Experience features
const EXPERIENCE_FEATURES = [
  {
    id: "screens",
    icon: <MonitorPlay className="h-6 w-6" />,
    title: "30+ HD Screens",
    description: "Never miss a play with our strategically placed screens offering perfect viewing from any seat in the house.",
  },
  {
    id: "sound",
    icon: <Speaker className="h-6 w-6" />,
    title: "Dedicated Audio Zones",
    description: "Multiple audio zones let you hear your game, even during busy multi-game days.",
  },
  {
    id: "food",
    icon: <UtensilsCrossed className="h-6 w-6" />,
    title: "Chef-Crafted Menu",
    description: "Elevated sports bar fare featuring fresh, local ingredients and house-made specialties.",
  },
  {
    id: "drinks",
    icon: <Beer className="h-6 w-6" />,
    title: "Craft Beer & Cocktails",
    description: "24 rotating taps featuring local breweries and a creative cocktail menu.",
  },
  {
    id: "events",
    icon: <Trophy className="h-6 w-6" />,
    title: "Special Game Events",
    description: "Themed events for major games with food and drink specials, contests, and giveaways.",
  },
  {
    id: "premium",
    icon: <Tv className="h-6 w-6" />,
    title: "Premium Viewing Sections",
    description: "Reservable premium sections with dedicated screens and wait service.",
  },
];

export function ExperienceHighlight() {
  const { location } = useLocationState();
  const isPortland = location === "portland";
  
  return (
    <div className="py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Image Column */}
        <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden rounded-xl shadow-xl">
          <Image 
            src={isPortland ? "/images/about/portland-experience.jpg" : "/images/about/salem-experience.jpg"} 
            alt="The Sports Bar Experience" 
            fill 
            className="object-cover" 
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="inline-block bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-lg text-primary-foreground font-bold">
              {isPortland ? "Portland Experience" : "Salem Experience"}
            </div>
          </div>
        </div>
        
        {/* Content Column */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">The Ultimate Game Day Experience</h2>
            <Separator className="w-20 h-1 bg-primary mb-4" />
            <p className="text-muted-foreground">
              We&apos;ve meticulously crafted the perfect environment for watching any sporting event. From our 
              state-of-the-art audiovisual setup to our chef-designed menu, every aspect of our {isPortland ? "Portland" : "Salem"} 
              location is designed to enhance your game day experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            {EXPERIENCE_FEATURES.map((feature) => (
              <div key={feature.id} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}