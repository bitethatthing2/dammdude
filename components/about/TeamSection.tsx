'use client';

import { useState, useEffect } from "react";
import { TeamMember } from "@/lib/types/about";
import { useLocationState } from "@/lib/hooks/useLocationState";
import { TeamMemberCard } from "./TeamMemberCard";

// Team members data
const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "member1",
    name: "James Mullins",
    role: "Owner & Founder",
    bio: "James founded Side Hustle Bar with a vision to create Salem's premier sports viewing destination. His passion for high-energy entertainment and exceptional hospitality drives our commitment to providing an unforgettable experience.",
    image_url: "/images/about/team-james.jpg",
    location_id: "both",
    social_links: {
      instagram: "https://instagram.com/sidehustle_bar",
    },
  },
  {
    id: "member2",
    name: "Rebecca Sanchez",
    role: "Executive Chef",
    bio: "Rebecca Sanchez is the culinary mastermind behind our award-winning Mexican cuisine. Her expertise and passion for authentic flavors have made Side Hustle Bar famous for serving the best tacos in Salem.",
    image_url: "/images/about/team-rebecca.jpg",
    location_id: "both",
    social_links: {
      instagram: "https://instagram.com/sidehustle_bar",
    },
  },
  {
    id: "member3",
    name: "Jason Taylor",
    role: "Portland General Manager",
    bio: "Jason brings 12 years of hospitality management to our Portland location. His expertise in operations and customer experience has made our Portland bar a favorite destination for sports fans.",
    image_url: "/images/about/team-jason.jpg",
    location_id: "portland",
    social_links: {
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "member4",
    name: "Sarah Johnson",
    role: "Salem General Manager",
    bio: "Sarah has been with us since day one in Salem. Her incredible knowledge of sports and dedication to service excellence has created a loyal community of regulars at our original location.",
    image_url: "/images/about/team-sarah.jpg",
    location_id: "salem",
    social_links: {
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
    },
  },
  {
    id: "member5",
    name: "David Wilson",
    role: "Beverage Director",
    bio: "A certified cicerone with a passion for craft beer, David curates our extensive beer selection and creates our signature cocktail menu, focusing on local breweries and seasonal ingredients.",
    image_url: "/images/about/team-david.jpg",
    location_id: "both",
    social_links: {
      instagram: "https://instagram.com",
    },
  },
  {
    id: "member6",
    name: "Michelle Park",
    role: "Events Coordinator",
    bio: "Michelle oversees our private events and special game day experiences, ensuring every gathering at our venues is memorable and runs smoothly, from fantasy football drafts to championship viewing parties.",
    image_url: "/images/about/team-michelle.jpg",
    location_id: "portland",
    social_links: {
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
    },
  },
];

export function TeamSection() {
  const { location } = useLocationState();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Filter team members based on location
  useEffect(() => {
    const filtered = TEAM_MEMBERS.filter(member => 
      member.location_id === location || member.location_id === "both"
    );
    setTeamMembers(filtered);
  }, [location]);
  
  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Meet Our Team</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The passionate people behind your ultimate sports watching experience at our {location === "portland" ? "Portland" : "Salem"} location
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}