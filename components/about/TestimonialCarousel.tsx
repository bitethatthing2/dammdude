'use client';

import { useState, useEffect } from "react";
import { Testimonial } from "@/types/features/about";
import { useLocationState } from "@/lib/hooks/useLocationState";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Testimonial data
const TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial1",
    quote: "This place has completely changed how I watch sports. The atmosphere during big games is electric, and the food is on another level compared to any sports bar I've been to.",
    author: "Michael T.",
    role: "Regular since 2019",
    location_id: "both",
  },
  {
    id: "testimonial2",
    quote: "I've hosted several fantasy football draft parties here, and they always take care of us perfectly. Great selection of beers, amazing food, and the staff really knows their sports.",
    author: "Jessica L.",
    role: "Fantasy League Commissioner",
    location_id: "portland",
  },
  {
    id: "testimonial3",
    quote: "As someone who's particular about watching games with good audio, this place gets it right. You can actually hear the commentary, and they'll put on any game you want to watch.",
    author: "David W.",
    role: "Sports Enthusiast",
    location_id: "salem",
  },
  {
    id: "testimonial4",
    quote: "The perfect mix of sports bar energy and quality dining. I can bring friends who aren't even into sports and they still have a great time because the food is outstanding.",
    author: "Sarah K.",
    location_id: "both",
  },
  {
    id: "testimonial5",
    quote: "Our company held a team event here during March Madness, and it was perfect. The staff helped us set up a bracket challenge and made sure everything ran smoothly.",
    author: "James R.",
    role: "Local Business Owner",
    location_id: "portland",
  },
  {
    id: "testimonial6",
    quote: "I've visited sports bars all over the country, and this place easily ranks in my top three. The combination of screen setup, sound quality, and menu is hard to beat.",
    author: "Thomas H.",
    location_id: "salem",
  },
];

export function TestimonialCarousel() {
  const { location } = useLocationState();
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  
  // Filter testimonials based on location
  useEffect(() => {
    const filtered = TESTIMONIALS.filter(testimonial => 
      testimonial.location_id === location || testimonial.location_id === "both"
    );
    setFilteredTestimonials(filtered);
    setActiveIndex(0); // Reset index when location changes
  }, [location]);
  
  // Auto-advance carousel
  useEffect(() => {
    if (filteredTestimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % filteredTestimonials.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [filteredTestimonials]);
  
  const handlePrevious = () => {
    setActiveIndex(prev => 
      prev === 0 ? filteredTestimonials.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setActiveIndex(prev => 
      (prev + 1) % filteredTestimonials.length
    );
  };
  
  if (filteredTestimonials.length === 0) {
    return null;
  }
  
  return (
    <div className="py-10 relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">What Our Fans Say</h2>
      </div>
      
      <div className="mx-auto max-w-3xl relative">
        <div className="absolute -top-6 left-0 text-primary/20">
          <Quote className="h-16 w-16" />
        </div>
        
        <div className="relative overflow-hidden">
          <div 
            className={`flex carousel-transform carousel-pos-${activeIndex}`}
          >
            {filteredTestimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="w-full flex-shrink-0 px-4"
              >
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <blockquote className="text-xl md:text-2xl italic text-foreground/90 text-center mb-6">
                      &quot;{testimonial.quote}&quot;
                    </blockquote>
                    
                    <div className="text-center">
                      <p className="font-semibold">{testimonial.author}</p>
                      {testimonial.role && (
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        {filteredTestimonials.length > 1 && (
          <div className="flex justify-center mt-6 gap-1">
            {filteredTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? "bg-primary w-6" : "bg-primary/30"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {filteredTestimonials.length > 1 && (
          <div className="flex justify-between mt-6">
            <button 
              onClick={handlePrevious}
              className="h-8 px-3 text-xs rounded-md bg-background text-foreground border border-input inline-flex items-center justify-center"
            >
              Previous
            </button>
            <button 
              onClick={handleNext}
              className="h-8 px-3 text-xs rounded-md bg-background text-foreground border border-input inline-flex items-center justify-center"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}