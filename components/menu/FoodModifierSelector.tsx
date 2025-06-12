// components/menu/FoodModifierSelector.tsx
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

interface MeatOption {
  id: string;
  name: string;
  price_adjustment: number;
}

interface SauceOption {
  id: string;
  name: string;
  price_adjustment: number;
}

interface FoodModifierSelectorProps {
  requiresMeatSelection: boolean;
  offersSauceSelection: boolean;
  selectedMeat: string;
  selectedSauces: string[];
  onMeatChange: (meatId: string) => void;
  onSauceChange: (sauceId: string, checked: boolean) => void;
  meatOptions?: MeatOption[];
  sauceOptions?: SauceOption[];
}

// Hardcoded meat options as specified in requirements
const DEFAULT_MEAT_OPTIONS: MeatOption[] = [
  { id: 'asada', name: 'ASADA (BEEF)', price_adjustment: 0 },
  { id: 'birria', name: 'BIRRIA (BEEF)', price_adjustment: 0 },
  { id: 'al-pastor', name: 'AL PASTOR (PORK)', price_adjustment: 0 },
  { id: 'carnitas', name: 'CARNITAS (PORK)', price_adjustment: 0 },
  { id: 'chorizo', name: 'CHORIZO (PORK)', price_adjustment: 0 },
  { id: 'pollo', name: 'POLLO (CHICKEN)', price_adjustment: 0 },
  { id: 'veggies', name: 'VEGGIES', price_adjustment: 0 },
  { id: 'lengua', name: 'LENGUA', price_adjustment: 2.00 },
  { id: 'shrimp', name: 'SHRIMP', price_adjustment: 2.00 },
];

// Hardcoded sauce options as specified in requirements
const DEFAULT_SAUCE_OPTIONS: SauceOption[] = [
  { id: 'guac', name: 'Guac', price_adjustment: 0 },
  { id: 'tomatillo', name: 'Tomatillo', price_adjustment: 0 },
  { id: 'ranchero', name: 'Ranchero', price_adjustment: 0 },
  { id: 'chile-de-arbol', name: 'Chile-De-Arbol', price_adjustment: 0 },
  { id: 'habanero', name: 'Habanero', price_adjustment: 0 },
];

export default function FoodModifierSelector({
  requiresMeatSelection,
  offersSauceSelection,
  selectedMeat,
  selectedSauces,
  onMeatChange,
  onSauceChange,
  meatOptions = DEFAULT_MEAT_OPTIONS,
  sauceOptions = DEFAULT_SAUCE_OPTIONS,
}: FoodModifierSelectorProps) {
  
  // Use provided options or fall back to defaults
  const availableMeatOptions = meatOptions.length > 0 ? meatOptions : DEFAULT_MEAT_OPTIONS;
  const availableSauceOptions = sauceOptions.length > 0 ? sauceOptions : DEFAULT_SAUCE_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Meat Selection (Required for items with "choice of meat") */}
      {requiresMeatSelection && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">Choose Meat</Label>
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </div>
          
          <RadioGroup value={selectedMeat} onValueChange={onMeatChange}>
            {availableMeatOptions.map(meat => (
              <div key={meat.id} className="flex items-center space-x-2">
                <RadioGroupItem value={meat.id} id={meat.id} />
                <Label
                  htmlFor={meat.id}
                  className="flex-1 cursor-pointer flex justify-between items-center"
                >
                  <span>{meat.name}</span>
                  {meat.price_adjustment > 0 && (
                    <span className="text-muted-foreground font-medium">
                      +${meat.price_adjustment.toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {requiresMeatSelection && !selectedMeat && (
            <p className="text-sm text-destructive">Please select a meat option</p>
          )}
        </div>
      )}

      {/* Sauce Selection (Optional for all entrees) */}
      {offersSauceSelection && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">Choose Chef Sauces</Label>
            <Badge variant="secondary" className="text-xs">Optional - Select up to 3</Badge>
          </div>
          
          <div className="space-y-2">
            {availableSauceOptions.map(sauce => (
              <div key={sauce.id} className="flex items-center space-x-2">
                <Checkbox
                  id={sauce.id}
                  checked={selectedSauces.includes(sauce.id)}
                  onCheckedChange={(checked) => onSauceChange(sauce.id, checked as boolean)}
                  disabled={!selectedSauces.includes(sauce.id) && selectedSauces.length >= 3}
                />
                <Label
                  htmlFor={sauce.id}
                  className="flex-1 cursor-pointer flex justify-between items-center"
                >
                  <span>{sauce.name}</span>
                  {sauce.price_adjustment > 0 && (
                    <span className="text-muted-foreground">
                      +${sauce.price_adjustment.toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{selectedSauces.length}/3 sauces selected</span>
            {selectedSauces.length === 3 && (
              <span className="text-amber-600">Maximum reached</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate modifier price adjustments
export function calculateModifierTotal(
  selectedMeat: string,
  selectedSauces: string[],
  meatOptions: MeatOption[] = DEFAULT_MEAT_OPTIONS,
  sauceOptions: SauceOption[] = DEFAULT_SAUCE_OPTIONS
): number {
  let total = 0;
  
  // Add meat price adjustment
  if (selectedMeat) {
    const meatOption = meatOptions.find(m => m.id === selectedMeat);
    if (meatOption) {
      total += meatOption.price_adjustment;
    }
  }
  
  // Add sauce price adjustments (typically $0 for chef sauces)
  selectedSauces.forEach(sauceId => {
    const sauceOption = sauceOptions.find(s => s.id === sauceId);
    if (sauceOption) {
      total += sauceOption.price_adjustment;
    }
  });
  
  return total;
}

// Helper function to get selected modifier names
export function getSelectedModifierNames(
  selectedMeat: string,
  selectedSauces: string[],
  meatOptions: MeatOption[] = DEFAULT_MEAT_OPTIONS,
  sauceOptions: SauceOption[] = DEFAULT_SAUCE_OPTIONS
) {
  const meat = selectedMeat ? meatOptions.find(m => m.id === selectedMeat)?.name : null;
  const sauces = selectedSauces
    .map(id => sauceOptions.find(s => s.id === id)?.name)
    .filter(Boolean);
  
  return { meat, sauces };
}
