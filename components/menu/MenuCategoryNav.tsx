// components/menu/MenuCategoryNav.tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuCategory } from '@/lib/types/menu';

interface MenuCategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function MenuCategoryNav({
  categories,
  activeCategory,
  onCategoryChange
}: MenuCategoryNavProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex space-x-2 pb-4 min-w-fit">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-2 shrink-0 whitespace-nowrap"
            )}
          >
            <span>{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
