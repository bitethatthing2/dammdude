"use client";

import Image from "next/image";
import { Instagram, Twitter, Linkedin } from "lucide-react";
import { TeamMember } from "@/lib/types/about";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg group">
      <div className="relative h-60 overflow-hidden">
        <Image 
          src={member.image_url} 
          alt={member.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <CardHeader className="px-5 pb-2 pt-5">
        <CardTitle className="text-xl">{member.name}</CardTitle>
        <CardDescription className="text-primary">{member.role}</CardDescription>
      </CardHeader>
      
      <CardContent className="px-5 pb-5">
        <p className="text-muted-foreground text-sm line-clamp-4">{member.bio}</p>
        
        {/* Social media links */}
        {member.social_links && (
          <div className="mt-4 flex gap-2">
            {member.social_links.instagram && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                <a href={member.social_links.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              </Button>
            )}
            
            {member.social_links.twitter && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                <a href={member.social_links.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              </Button>
            )}
            
            {member.social_links.linkedin && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                <a href={member.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}