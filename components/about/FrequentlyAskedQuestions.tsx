'use client';

import { FaqItem } from "@/types/features/about";
import { useLocationState } from "@/lib/hooks/useLocationState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ data
const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq1",
    question: "What makes Side Hustle the 'UFC House'?",
    answer: "We're known as Oregon's premier UFC destination with multiple large screens, no cover charge during fights, and an electric atmosphere that draws capacity crowds. Whether it's UFC, boxing, or major sporting events, we create an unmatched viewing experience for fight fans.",
    location_id: "both",
  },
  {
    id: "faq2",
    question: "What's so special about your birria tacos?",
    answer: "Our signature birria tacos have become legendary among locals! Executive Chef Rebecca Sanchez creates authentic birria with rich, slow-cooked flavors, served with house-made salsas that customers describe as 'bomb.' We also offer birria ramen and birria burritos for creative fusion options.",
    location_id: "both",
  },
  {
    id: "faq3",
    question: "Are you family-friendly during the day?",
    answer: "Absolutely! We're a family-friendly restaurant by day, transforming into vibrant nightlife after dark. The multi-level design offers different atmospheres, from intimate lounges to high-energy main floor perfect for groups of all ages during daytime hours.",
    location_id: "both",
  },
  {
    id: "faq4",
    question: "Do you host events and live music?",
    answer: "Yes! We regularly host Game Night Live with trivia and R0CK'N Bingo, seasonal celebrations, and our Portland location features live music Thursday through Sunday evenings. We've even hosted notable concerts with artists like Trinidad James and ILOVEMAKONNEN.",
    location_id: "both",
  },
  {
    id: "faq5",
    question: "What makes your Mexican cuisine authentic?",
    answer: "Under Executive Chef Rebecca Sanchez's leadership, we've redefined expectations for bar food with extensive Mexican cuisine that rivals dedicated restaurants. Every salsa is made in-house daily with multiple varieties, and our menu spans traditional favorites to creative fusion offerings.",
    location_id: "both",
  },
  {
    id: "faq6",
    question: "What's the price range for meals?",
    answer: "Most meals are priced between $10-20 per person, offering exceptional value for the quality. Our extensive Mexican menu features everything from traditional carnitas empanadas and street tacos to creative loaded nachos and keto-friendly options.",
    location_id: "both",
  },
  {
    id: "faq7",
    question: "Do you offer delivery and takeout?",
    answer: "Yes! You can order for delivery through DoorDash, Uber Eats, and Seamless to extend the Side Hustle experience beyond our physical locations. Perfect for enjoying our legendary birria tacos at home.",
    location_id: "both",
  },
  {
    id: "faq8",
    question: "What makes the Salem location special?",
    answer: "Our flagship Salem location opened in late 2023 at 145 Liberty St NE in historic downtown. It features multi-level dining, upstairs lounges, outdoor parklet seating, and a gaming area with pool, giant Jenga, and Connect Four. We've earned a stellar 4.7-star rating across 750+ Google reviews!",
    location_id: "salem",
  },
  {
    id: "faq9",
    question: "What's new at the Portland location?",
    answer: "Our Portland location at 327 SW Morrison Street features extended hours (until 3 AM on weekends!) and live music Thursday through Sunday evenings. The venue adds a new dimension to the Side Hustle experience in the heart of Portland's entertainment district.",
    location_id: "portland",
  },
  {
    id: "faq10",
    question: "How can I stay connected with Side Hustle?",
    answer: "Follow us on Instagram @sidehustle_bar where we have over 101,000 followers! We regularly share mouth-watering food photography, event announcements, and behind-the-scenes content. It's the best way to stay updated on UFC fights, live music, and special events.",
    location_id: "both",
  },
];

export function FrequentlyAskedQuestions() {
  const { location } = useLocationState();
  
  // Filter FAQs based on location
  const filteredFaqs = FAQ_ITEMS.filter(faq => 
    faq.location_id === location || faq.location_id === "both"
  );
  
  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2 text-white">Frequently Asked Questions</h2>
        <p className="text-white/80 max-w-2xl mx-auto">
          Everything you need to know about visiting our {location === "portland" ? "Portland" : "Salem"} location
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-lg font-medium text-left text-white">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-white/80">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}