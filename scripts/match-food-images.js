// scripts/match-food-images.js
const fs = require('fs');
const path = require('path');

// Available food images
const availableImages = [
  '3-tacos-beans-rice.png',
  '3-tacos.png', 
  'basket-of-fries.png',
  'basket-of-tots.png',
  'beans-rice.png',
  'beans.png',
  'birria-consume.png',
  'burrito.png',
  'chefa-sauce.png',
  'CHILAQUILES.PNG',
  'chips-guac-salsa.png',
  'chips-guac-salsa.png',
  'empanadas.png',
  'fish-tacos.png',
  'flautas.png',
  'loaded-nacho.png',
  'mango-civeche.png',
  'margarita.png',
  'molita.png',
  'pancakes.jpg',
  'quesadilla.png',
  'rice.png',
  'taco-salad.png',
  'tacos.png',
  'torta.png'
];

// Create mapping between likely menu items and images
const itemImageMapping = {
  // Exact or very close matches
  'chilaquiles': 'CHILAQUILES.PNG',
  'burrito': 'burrito.png',
  'quesadilla': 'quesadilla.png',
  'empanadas': 'empanadas.png',
  'flautas': 'flautas.png',
  'torta': 'torta.png',
  'pancakes': 'pancakes.jpg',
  'margarita': 'margarita.png',
  
  // Tacos variations
  'fish tacos': 'fish-tacos.png',
  'fish taco': 'fish-tacos.png',
  'tacos': 'tacos.png',
  'taco': 'tacos.png',
  '3 tacos': '3-tacos.png',
  'three tacos': 'tacos.png',
  'taco combo': 'tacos.png',
  'taco plate': 'tacos.png',
  '3 tacos beans rice': '3-tacos-beans-rice.png',
  'taco dinner': '3-tacos-beans-rice.png',

  // Sides and additions
  'beans and rice': 'beans-and-rice.png',
  'rice and beans': 'beans-and-rice.png',
  'side of beans and rice': 'beans-and-rice.png',
  'beans': 'beans.png',
  'rice': 'rice.png',
  'spanish rice': 'rice.png',
  'refried beans': 'beans.png',
  'black beans': 'beans.png',
  
  // Appetizers and sides
  'chips and salsa': 'chips-guac-salsa.png',
  'chips & salsa': 'chips-guac-salsa.png',
  'salsa and chips': 'chips-guac-salsa.png',
  'chips and guacamole': 'chips-guac-salsa.png',
  'chips & guac': 'chips-guac-salsa.png',
  'guac and chips': 'chips-guac-salsa.png',
  'guacamole': 'chips-guac-salsa.png',

  // Specialty items
  'birria consommé': 'birria-consume.png',
  'birria broth': 'birria-consume.png',
  'consommé': 'birria-consume.png',
  'birria soup': 'birria-consume.png',
  'chefa sauce': 'chefa-sauce.png',
  'special sauce': 'chefa-sauce.png',
  'signature sauce': 'chefa-sauce.png',
  'molita': 'molita.png',
  'mango ceviche': 'mango-civeche.png',
  'mango ceviche': 'mango-civeche.png',
  'ceviche': 'mango-civeche.png',
  
  // Salads and loaded items
  'taco salad': 'taco-salad.png',
  'loaded nachos': 'loaded-nacho.png',
  'loaded nacho': 'loaded-nacho.png',
  'nachos': 'loaded-nacho.png',
  'super nachos': 'loaded-nacho.png',
  
  // Sides - fries and tots
  'french fries': 'basket-of-fries.png',
  'fries': 'basket-of-fries.png',
  'basket of fries': 'basket-of-fries.png',
  'side of fries': 'basket-of-fries.png',
  'tater tots': 'basket-of-tots.png',
  'tots': 'basket-of-tots.png',
  'basket of tots': 'basket-of-tots.png',
  'potato tots': 'basket-of-tots.png',
};

// Function to find best image match for a menu item
function findImageForMenuItem(itemName, description = '') {
  const searchText = (itemName + ' ' + (description || '')).toLowerCase();
  
  // Sort keywords by length (longest first) to prioritize more specific matches
  const sortedMappings = Object.entries(itemImageMapping).sort((a, b) => b[0].length - a[0].length);
  
  // Try exact matches first (longest matches first)
  for (const [keyword, imageName] of sortedMappings) {
    if (searchText.includes(keyword.toLowerCase())) {
      return imageName;
    }
  }
  
  // Try partial matches for common food types (these are now less likely to be needed)
  if (searchText.includes('taco') && !searchText.includes('salad')) {
    return 'tacos.png';
  }
  if (searchText.includes('nacho')) {
    return 'loaded-nacho.png';
  }
  if (searchText.includes('burrito')) {
    return 'burrito.png';
  }
  if (searchText.includes('quesadilla')) {
    return 'quesadilla.png';
  }
  
  return null; // No match found
}

// Generate SQL for creating image records and updating menu items
function generateImageInsertSQL() {
  const imageInserts = availableImages.map(imageName => {
    const imagePath = `/food-menu-images/${imageName}`;
    const name = imageName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '); // Remove extension and replace dashes/underscores
    
    return `-- Insert image for ${imageName}
INSERT INTO public.images (
  id, 
  url, 
  name, 
  storage_path, 
  image_type, 
  created_at, 
  updated_at
) VALUES (
  uuid_generate_v4(),
  '${imagePath}',
  '${name}',
  'public${imagePath}',
  'menu_item',
  NOW(),
  NOW()
) ON CONFLICT (url) DO NOTHING;`;
  }).join('\n\n');

  return imageInserts;
}

// Test the mapping function
console.log('=== Food Image Mapping Analysis ===\n');

console.log('Available Images:');
availableImages.forEach(img => console.log(`  - ${img}`));

console.log('\n=== Sample Mappings ===');
const sampleItems = [
  'Fish Tacos',
  'Carne Asada Burrito', 
  'Chicken Quesadilla',
  'Chips and Salsa',
  'Loaded Nachos',
  'Taco Salad',
  '3 Tacos Beans Rice',
  'Birria Consommé',
  'Chilaquiles',
  'French Fries'
];

sampleItems.forEach(item => {
  const match = findImageForMenuItem(item);
  console.log(`  "${item}" -> ${match || 'No match'}`);
});

console.log('\n=== Generated SQL (first few records) ===');
console.log(generateImageInsertSQL().split('\n\n')[0]);

module.exports = {
  availableImages,
  itemImageMapping,
  findImageForMenuItem,
  generateImageInsertSQL
};
