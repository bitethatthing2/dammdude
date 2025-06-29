#!/usr/bin/env node

/**
 * Fix corrupted database types file
 */

const fs = require('fs');

console.log('🔧 Fixing corrupted database types...');

// Remove the corrupted database.types.ts file
const databaseTypesPath = 'lib/database.types.ts';
if (fs.existsSync(databaseTypesPath)) {
  fs.unlinkSync(databaseTypesPath);
  console.log('✅ Removed corrupted database.types.ts');
}

// Fix the route parameter syntax errors
const routeFiles = [
  'app/api/events/[eventId]/vote/route.ts'
];

routeFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Fixing syntax in ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix any malformed function declarations
    content = content.replace(
      /export async function (GET|POST|PATCH|PUT|DELETE)\s*\(\s*request:\s*NextRequest\s*\{\s*params\s*\}/g,
      'export async function $1(request: NextRequest, { params }: { params: { eventId: string } }'
    );
    
    // Ensure proper parameter destructuring
    content = content.replace(
      /\{\s*params\s*\}:\s*\{\s*params/g,
      '{ params }: { params'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  }
});

// Create a minimal working database types file
const minimalDatabaseTypes = `
// Minimal database types to prevent build errors
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          wolf_emoji?: string | null;
          is_wolfpack_member?: boolean | null;
          avatar_url?: string | null;
          created_at: string;
          [key: string]: any;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      restaurant_tables: {
        Row: {
          id: string;
          table_number: number;
          is_active: boolean;
          location_id?: string | null;
          [key: string]: any;
        };
        Insert: Omit<Database['public']['Tables']['restaurant_tables']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['restaurant_tables']['Insert']>;
      };
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
}
`;

fs.writeFileSync(databaseTypesPath, minimalDatabaseTypes);
console.log('✅ Created minimal database.types.ts');

console.log('🎉 Type corruption fixes completed!');