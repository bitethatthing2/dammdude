"use client";

import { useEffect, useRef } from "react";
import { Info, Star } from "lucide-react";
import { useLocationState } from "@/lib/hooks/useLocationState";
import { Separator } from "@/components/ui/separator";

// Custom components for About page
import { StoryBlock } from "@/components/about/StoryBlock";
import { ValuesHighlight } from "@/components/about/ValuesHighlight";
import { ExperienceHighlight } from "@/components/about/ExperienceHighlight";
import { TeamSection } from "@/components/about/TeamSection";
import { MilestoneTimeline } from "@/components/about/MilestoneTimeline";
import { TestimonialCarousel } from "@/components/about/TestimonialCarousel";
import { CommunityInvolvement } from "@/components/about/CommunityInvolvement";
import { FrequentlyAskedQuestions } from "@/components/about/FrequentlyAskedQuestions";

// Scroll effect for section visibility
const useIntersectionObserver = (elementRefs: React.MutableRefObject<(HTMLElement | null)[]>) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    elementRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      elementRefs.current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [elementRefs]);
};

export default function AboutPage() {
  const { location } = useLocationState();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  
  // Add intersection observer for scroll animations
  useIntersectionObserver(sectionRefs);
  
  const isPortland = location === "portland";
  
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">About Us</h1>
        <Info className="h-5 w-5 text-primary" />
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 to-background pt-10 pb-16 text-center">
        <div className="absolute top-10 left-10 hidden lg:block">
          <Star className="h-16 w-16 text-primary/5" />
        </div>
        <div className="absolute bottom-20 right-10 hidden lg:block">
          <Star className="h-12 w-12 text-primary/5" />
        </div>
        
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Ultimate Sports Destination</h1>
          <p className="text-xl text-muted-foreground">
            Experience the perfect blend of exceptional food, electric atmosphere, 
            and premium sports viewing at our {isPortland ? "Portland" : "Salem"} location.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Story Section */}
        <section 
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <StoryBlock isPortland={isPortland} />
        </section>
        
        {/* Experience Section */}
        <section 
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <ExperienceHighlight />
        </section>
        
        {/* Separator with accent text */}
        <div className="py-2 my-4">
          <div className="flex items-center">
            <Separator className="flex-grow" />
            <span className="px-6 text-lg font-medium text-primary">Our Values</span>
            <Separator className="flex-grow" />
          </div>
        </div>
        
        {/* Values Section */}
        <section 
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <ValuesHighlight />
        </section>
        
        {/* Milestones Section */}
        <section 
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <MilestoneTimeline />
        </section>
        
        {/* Team Section */}
        <section 
          ref={(el) => { sectionRefs.current[4] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <TeamSection />
        </section>
        
        {/* Decorative Separator */}
        <div className="py-4 my-6">
          <Separator className="w-full" />
        </div>
        
        {/* Community Section */}
        <section 
          ref={(el) => { sectionRefs.current[5] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <CommunityInvolvement />
        </section>
        
        {/* Testimonials Section */}
        <section 
          ref={(el) => { sectionRefs.current[6] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <TestimonialCarousel />
        </section>
        
        {/* FAQ Section */}
        <section 
          ref={(el) => { sectionRefs.current[7] = el; }}
          className="py-12 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <FrequentlyAskedQuestions />
        </section>
      </div>
    </div>
  );
}