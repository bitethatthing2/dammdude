import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu | Side Hustle',
  description: 'Browse our menu and place your order',
};

/**
 * Simplified Menu page to fix build errors
 */
export default function MenuPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Our Menu</h1>
      <p className="text-muted-foreground mb-6">
        View our delicious food and drinks offerings
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Food', 'Drinks', 'Desserts'].map((category, index) => (
          <div key={index} className="bg-card rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium mb-2">{category}</h2>
            <p className="text-muted-foreground text-sm">
              Items in this category will be displayed here
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}