"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useLocationState } from "@/lib/hooks/useLocationState";

interface StoryBlockProps {
  isPortland: boolean;
}

export function StoryBlock({ isPortland }: StoryBlockProps) {
  return (
    <div className="relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 hidden md:block">
        <Star className="h-8 w-8 text-primary/20" />
      </div>
      <div className="absolute bottom-0 left-1/4 -mb-4 hidden md:block">
        <Star className="h-6 w-6 text-primary/10" />
      </div>
      
      <Card className="overflow-hidden border-none shadow-lg md:shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image section */}
          <div className="relative h-[300px] md:h-auto overflow-hidden">
            <Image 
              src={isPortland ? "/images/about/portland-location.jpg" : "/images/about/salem-location.jpg"} 
              alt={isPortland ? "Portland Sports Bar" : "Salem Sports Bar"}
              fill
              className="object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-in-out"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-white text-sm font-medium">Est. 2018</span>
            </div>
          </div>
          
          {/* Content section */}
          <CardContent className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-2">Our Story</h3>
            <Separator className="w-20 h-1 bg-primary mb-6" />
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2018, our {isPortland ? "Portland" : "Salem"} location began with a simple vision: 
                create the ultimate sports watching experience combined with exceptional food and drink.
              </p>
              <p>
                What started as a small venue with just a few screens has grown into the premier sports destination 
                in {isPortland ? "Portland" : "Salem"}, featuring over 30 HD screens, state-of-the-art sound systems, 
                and a menu that goes far beyond typical sports bar fare.
              </p>
              <p>
                Through the years, we've become more than just a place to watch games - we're a community hub where 
                friends gather, rivalries are celebrated, and memories are made.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}