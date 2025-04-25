"use client";

import Image from "next/image";
import { Milestone } from "@/lib/types/about";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Milestone data
const MILESTONES: Milestone[] = [
  {
    id: "founding",
    year: "2018",
    title: "Our Founding",
    description: "We opened our first location in Salem with just 10 screens and a dream to create the best sports viewing experience in the city.",
    image_url: "/images/about/milestone-founding.jpg"
  },
  {
    id: "expansion",
    year: "2019",
    title: "Menu Expansion",
    description: "We completely revamped our menu, bringing on board Chef Michael Rodriguez to create elevated sports bar cuisine that sets us apart.",
    image_url: "/images/about/milestone-menu.jpg"
  },
  {
    id: "portland",
    year: "2021",
    title: "Portland Location",
    description: "Due to popular demand, we expanded to Portland, opening our flagship location with over 30 screens and our signature food and atmosphere.",
    image_url: "/images/about/milestone-portland.jpg"
  },
  {
    id: "award",
    year: "2023",
    title: "Local Recognition",
    description: "Named 'Best Sports Bar' in both Salem and Portland by local publications, cementing our reputation as the premier sports destination.",
    image_url: "/images/about/milestone-award.jpg"
  },
  {
    id: "app",
    year: "2025",
    title: "Digital Innovation",
    description: "Launched our new mobile app, allowing fans to reserve tables, order ahead, and stay connected with upcoming events and specials.",
    image_url: "/images/about/milestone-app.jpg"
  }
];

// Define a placeholder image URL
const PLACEHOLDER_IMAGE_URL = '/images/placeholder.jpg'; // Adjust path if needed

export function MilestoneTimeline() {
  return (
    <div className="py-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">Our Journey</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          From humble beginnings to becoming the premier sports bar destination in Oregon,
          explore the key moments that have shaped our growth and evolution.
        </p>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />
        
        <div className="space-y-16">
          {MILESTONES.map((milestone, index) => (
            <div key={milestone.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute left-1/2 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2 -translate-y-2 hidden md:block" />
              
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Year marker for mobile */}
                <div className="md:hidden bg-primary/10 inline-block px-3 py-1 rounded-full text-primary font-medium text-sm mb-2">
                  {milestone.year}
                </div>
                
                {/* Content side */}
                <div className={`${index % 2 !== 0 ? 'md:text-right md:pl-10' : 'md:pr-10'}`}>
                  {/* Year marker for desktop */}
                  <div className="hidden md:inline-block bg-primary/10 px-3 py-1 rounded-full text-primary font-medium text-sm mb-2">
                    {milestone.year}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>{milestone.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Image side */}
                <div className={`${index % 2 !== 0 ? 'md:pr-10' : 'md:pl-10'}`}>
                  <div className="relative h-60 overflow-hidden rounded-xl shadow-md">
                    <Image 
                      src={milestone.image_url || PLACEHOLDER_IMAGE_URL}
                      alt={milestone.title}
                      fill
                      className="object-cover object-center hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}