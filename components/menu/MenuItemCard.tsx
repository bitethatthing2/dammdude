// components/menu/MenuItemCard.tsx
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ImageOff } from 'lucide-react';
import { MenuItem, MenuModifier } from '@/lib/types/menu';
// Make sure MenuItemModal.tsx exists in the same folder, or update the path if it's elsewhere
import MenuItemModal from './MenuItemModal';

interface MenuItemCardProps {
  item: MenuItem;
  modifiers: MenuModifier[];
}

export default function MenuItemCard({ item, modifiers }: MenuItemCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Image placeholder or actual image */}
          <div className="relative h-48 bg-muted flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="w-12 h-12 text-muted-foreground" />
            )}
            <Badge
              className="absolute top-2 right-2"
              variant="secondary"
            >
              ${item.price.toFixed(2)}
            </Badge>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => setShowModal(true)}
            className="w-full group-hover:shadow-sm"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      <MenuItemModal
        item={item}
        modifiers={modifiers}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
