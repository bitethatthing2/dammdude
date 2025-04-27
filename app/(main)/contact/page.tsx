import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Phone className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Contact Us</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Get In Touch</h2>
          <p className="text-muted-foreground mb-6">
            Have questions or feedback? We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
          </p>
          
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="first-name" className="text-sm font-medium">First name</label>
                <Input id="first-name" placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="last-name" className="text-sm font-medium">Last name</label>
                <Input id="last-name" placeholder="Enter your last name" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" placeholder="Enter your email" type="email" />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Textarea id="message" placeholder="Enter your message" className="min-h-[120px]" />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Location & Hours</h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Salem</CardTitle>
                <CardDescription>Our original location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>145 Liberty St NE Suite #101, Salem, OR 97301</p>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>(503) 391-9977</p>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>contact@thesidehustlesalem.com</p>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Hours:</p>
                  <p className="text-sm">Sunday - Wednesday: 10 AM - 11 PM</p>
                  <p className="text-sm">Thursday: 10 AM - 12 AM</p>
                  <p className="text-sm">Friday - Saturday: 10 AM - 2 AM</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Portland</CardTitle>
                <CardDescription>Our newest location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>327 SW Morrison St, Portland, OR 97204</p>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>(503) 391-9977</p>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <p>contact@thesidehustleportland.com</p>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Hours:</p>
                  <p className="text-sm">Sunday: 10 AM - 12 AM</p>
                  <p className="text-sm">Monday - Wednesday: 10 AM - 11 PM</p>
                  <p className="text-sm">Thursday: 10 AM - 1 AM</p>
                  <p className="text-sm">Friday - Saturday: 10 AM - 2:30 AM</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
