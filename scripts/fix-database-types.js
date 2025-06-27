#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the SQL migration file to understand the actual schema
const migrationPath = path.join(__dirname, '../supabase/migrations/20250612_complete_schema.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

// Extract table definitions
const tableRegex = /CREATE TABLE IF NOT EXISTS public\.(\w+)\s*\(([\s\S]*?)\);/g;
const tables = {};

let match;
while ((match = tableRegex.exec(migrationContent)) !== null) {
  const tableName = match[1];
  const tableDefinition = match[2];
  
  // Parse columns
  const columns = {};
  const columnLines = tableDefinition.split('\n').filter(line => line.trim() && !line.includes('FOREIGN KEY'));
  
  columnLines.forEach(line => {
    const columnMatch = line.match(/^\s*(\w+)\s+(\w+(?:\([^)]*\))?)/);
    if (columnMatch) {
      const [, columnName, columnType] = columnMatch;
      if (columnName && columnName.toUpperCase() !== 'PRIMARY' && columnName.toUpperCase() !== 'CONSTRAINT') {
        columns[columnName] = mapSqlTypeToTs(columnType);
      }
    }
  });
  
  tables[tableName] = columns;
}

function mapSqlTypeToTs(sqlType) {
  const type = sqlType.toUpperCase();
  if (type.includes('UUID')) return 'string';
  if (type.includes('TEXT') || type.includes('VARCHAR')) return 'string';
  if (type.includes('INTEGER') || type.includes('SERIAL') || type.includes('NUMERIC')) return 'number';
  if (type.includes('BOOLEAN')) return 'boolean';
  if (type.includes('TIMESTAMP')) return 'string';
  if (type.includes('JSONB') || type.includes('JSON')) return 'Json';
  return 'unknown';
}

// Generate TypeScript types
let output = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
`;

// Add all tables
Object.entries(tables).forEach(([tableName, columns]) => {
  output += `      ${tableName}: {
        Row: {
`;
  
  Object.entries(columns).forEach(([columnName, columnType]) => {
    const isNullable = !columnName.includes('id') && !columnName.includes('created_at');
    output += `          ${columnName}: ${columnType}${isNullable ? ' | null' : ''}\n`;
  });
  
  output += `        }
        Insert: {
`;
  
  Object.entries(columns).forEach(([columnName, columnType]) => {
    const isOptional = columnName.includes('id') || columnName.includes('created_at') || columnName.includes('updated_at');
    const isNullable = !columnName.includes('id') && !columnName.includes('created_at');
    output += `          ${columnName}${isOptional ? '?' : ''}: ${columnType}${isNullable ? ' | null' : ''}${isOptional ? ' | undefined' : ''}\n`;
  });
  
  output += `        }
        Update: {
`;
  
  Object.entries(columns).forEach(([columnName, columnType]) => {
    const isNullable = !columnName.includes('id') && !columnName.includes('created_at');
    output += `          ${columnName}?: ${columnType}${isNullable ? ' | null' : ''} | undefined\n`;
  });
  
  output += `        }
        Relationships: []
      }
`;
});

output += `    }
    Views: {}
    Functions: {
      update_notification_preferences: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
`;

// Write the new database types
const outputPath = path.join(__dirname, '../lib/database.types.ts');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('✅ Database types regenerated successfully!');
console.log(`Found ${Object.keys(tables).length} tables:`);
Object.keys(tables).forEach(table => console.log(`  - ${table}`));