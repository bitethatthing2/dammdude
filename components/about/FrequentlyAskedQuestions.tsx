"use client";

import { FaqItem } from "@/lib/types/about";
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
    question: "Do you take reservations for game days?",
    answer: "Yes! We highly recommend reservations for major sporting events. You can reserve a table through our app, website, or by calling us directly. Reservations for big games should be made at least 48 hours in advance.",
    location_id: "both",
  },
  {
    id: "faq2",
    question: "Can I request a specific game to be shown?",
    answer: "Absolutely! With our multiple screens, we can accommodate requests for specific games. For less common games or during busy times like March Madness, we recommend calling ahead to ensure we can dedicate a screen to your game.",
    location_id: "both",
  },
  {
    id: "faq3",
    question: "Are children allowed?",
    answer: "Yes, we're family-friendly until 9PM. After 9PM, we transition to a 21+ environment. We have a kids' menu available during family hours.",
    location_id: "both",
  },
  {
    id: "faq4",
    question: "Do you host private events?",
    answer: "Yes, we offer private event spaces for parties, corporate events, and special occasions. Our Portland location has a dedicated event room for up to 40 people, while our Salem location can accommodate groups of up to 25 in a semi-private area.",
    location_id: "both",
  },
  {
    id: "faq5",
    question: "What makes your food different from other sports bars?",
    answer: "Unlike typical sports bars, we have a full kitchen with a dedicated chef who creates elevated sports bar classics using local ingredients. Our menu features house-made sauces, hand-formed burgers, and several unique items you won't find elsewhere.",
    location_id: "both",
  },
  {
    id: "faq6",
    question: "Do you offer any vegetarian or gluten-free options?",
    answer: "Yes! We have several vegetarian, vegan, and gluten-free options clearly marked on our menu. Our kitchen staff is trained to handle food allergies and special dietary requirements.",
    location_id: "both",
  },
  {
    id: "faq7",
    question: "Is there a cover charge during big games?",
    answer: "For most regular season games, there is no cover charge. For major events like championships, we may have a small cover charge that can be applied to your food and drink tab. Reserved tables for premium events may have a minimum purchase requirement.",
    location_id: "both",
  },
  {
    id: "faq8",
    question: "What's on tap at the Portland location?",
    answer: "Our Portland location features 24 rotating taps with a focus on local Oregon and Washington craft beers. We always have a selection of IPAs, lagers, stouts, and seasonal offerings, plus ciders and non-alcoholic options.",
    location_id: "portland",
  },
  {
    id: "faq9",
    question: "Is there parking available at the Salem location?",
    answer: "Yes, our Salem location has a dedicated parking lot with 40 spaces. During major events, we offer additional parking in the adjacent lot with validation.",
    location_id: "salem",
  },
  {
    id: "faq10",
    question: "Do you show international sports?",
    answer: "Absolutely! We show a wide range of international sports including Premier League, La Liga, Champions League soccer, rugby, cricket, and Formula 1. For specific international events, we recommend calling ahead to confirm availability.",
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
        <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about visiting our {location === "portland" ? "Portland" : "Salem"} location
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-lg font-medium text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}