#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd();

// Utility function to read file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Function to find all files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && 
            !item.startsWith('.') && 
            item !== 'node_modules' && 
            item !== '.next' &&
            item !== 'dist' &&
            item !== 'build' &&
            item !== 'supabase') {
          traverse(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeSupabaseQueries() {
  console.log('🔍 Analyzing Supabase API calls and potential 500 error causes...\n');
  
  const allFiles = findFiles(PROJECT_ROOT);
  
  const apiCalls = [];
  const rpcCalls = [];
  const authCalls = [];
  const problematicQueries = [];
  
  for (const filePath of allFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    // Skip our own script files
    if (relativePath.includes('fix-supabase') || relativePath.includes('scripts')) {
      continue;
    }
    
    // Look for the specific failing query
    if (content.includes('wolfpack_members')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('wolfpack_members')) {
          apiCalls.push({
            file: relativePath,
            line: index + 1,
            code: line.trim(),
            type: 'wolfpack_members query'
          });
        }
      });
    }
    
    // Look for RPC calls
    if (content.includes('.rpc(')) {
      const rpcMatches = content.match(/\.rpc\([^)]+\)/g);
      if (rpcMatches) {
        rpcMatches.forEach(match => {
          rpcCalls.push({
            file: relativePath,
            call: match
          });
        });
      }
    }
    
    // Look for auth calls
    if (content.includes('auth.getUser') || content.includes('auth.getSession')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('auth.getUser') || line.includes('auth.getSession')) {
          authCalls.push({
            file: relativePath,
            line: index + 1,
            code: line.trim()
          });
        }
      });
    }
    
    // Look for potentially problematic queries
    if (content.includes('.select(') || content.includes('.from(')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Look for queries that might cause 500 errors
        if (trimmed.includes('.select(') || trimmed.includes('.from(')) {
          // Check for potential issues
          const issues = [];
          
          if (trimmed.includes('id=eq.') && !trimmed.includes('await')) {
            issues.push('Missing await on id query');
          }
          
          if (trimmed.includes('.eq(') && trimmed.includes('undefined')) {
            issues.push('Passing undefined to .eq()');
          }
          
          if (trimmed.includes('.select(') && trimmed.includes('*') && trimmed.includes('wolfpack')) {
            issues.push('Select * on wolfpack table');
          }
          
          if (issues.length > 0) {
            problematicQueries.push({
              file: relativePath,
              line: index + 1,
              code: trimmed,
              issues: issues
            });
          }
        }
      });
    }
  }
  
  console.log('📊 ANALYSIS RESULTS:\n');
  
  console.log('🎯 wolfpack_members QUERIES:');
  console.log('====================================');
  if (apiCalls.length === 0) {
    console.log('✅ No direct wolfpack_members queries found\n');
  } else {
    apiCalls.forEach(call => {
      console.log(`📁 ${call.file}:${call.line}`);
      console.log(`  ${call.code}`);
      console.log('');
    });
  }
  
  console.log('🔧 RPC CALLS:');
  console.log('=============');
  if (rpcCalls.length === 0) {
    console.log('✅ No RPC calls found\n');
  } else {
    const uniqueRpcs = [...new Set(rpcCalls.map(call => call.call))];
    uniqueRpcs.forEach(rpc => {
      console.log(`📞 ${rpc}`);
      const files = rpcCalls.filter(call => call.call === rpc).map(call => call.file);
      console.log(`   Used in: ${[...new Set(files)].join(', ')}`);
      console.log('');
    });
  }
  
  console.log('🔐 AUTH CALLS:');
  console.log('==============');
  if (authCalls.length === 0) {
    console.log('✅ No auth calls found\n');
  } else {
    authCalls.slice(0, 5).forEach(call => {
      console.log(`📁 ${call.file}:${call.line}`);
      console.log(`  ${call.code}`);
      console.log('');
    });
    if (authCalls.length > 5) {
      console.log(`... and ${authCalls.length - 5} more auth calls\n`);
    }
  }
  
  console.log('⚠️  POTENTIALLY PROBLEMATIC QUERIES:');
  console.log('====================================');
  if (problematicQueries.length === 0) {
    console.log('✅ No obviously problematic queries found\n');
  } else {
    problematicQueries.forEach(query => {
      console.log(`📁 ${query.file}:${query.line}`);
      console.log(`  ${query.code}`);
      query.issues.forEach(issue => {
        console.log(`  ⚠️  ${issue}`);
      });
      console.log('');
    });
  }
  
  console.log('🎯 SPECIFIC 500 ERROR INVESTIGATION:');
  console.log('====================================');
  
  // Check for the specific failing URL pattern
  const failingPattern = 'wolfpack_members?select=id%2Clocation_id%2Cjoined_at%2Cstatus%2Cis_active&id=eq.';
  console.log('Looking for queries matching the failing pattern...\n');
  
  let foundMatchingQueries = false;
  for (const filePath of allFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    // Look for the specific query structure
    if (content.includes('wolfpack_members') && 
        content.includes('.select(') && 
        content.includes('id') &&
        content.includes('.eq(')) {
      
      console.log(`🎯 Found matching query pattern in: ${relativePath}`);
      
      const lines = content.split('\n');
      let queryContext = [];
      
      lines.forEach((line, index) => {
        if (line.includes('wolfpack_members') || 
            (queryContext.length > 0 && line.includes('.eq(')) ||
            (queryContext.length > 0 && line.includes('.select('))) {
          queryContext.push(`  ${index + 1}: ${line.trim()}`);
          
          if (line.includes(';') || line.includes('})') || queryContext.length > 10) {
            console.log(queryContext.join('\n'));
            console.log('');
            queryContext = [];
            foundMatchingQueries = true;
          }
        }
      });
    }
  }
  
  if (!foundMatchingQueries) {
    console.log('❌ No matching query patterns found');
    console.log('The 500 error might be coming from:');
    console.log('  - RPC functions on the server');
    console.log('  - Middleware or API routes');
    console.log('  - Database triggers or policies');
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. Check the Supabase dashboard logs for the 500 error details');
  console.log('2. Verify RLS policies on wolfpack_members table');
  console.log('3. Check if the id being passed is valid');
  console.log('4. Ensure all required columns exist in the table');
  console.log('5. Check for any database triggers that might be failing');
  
  console.log('\n🔍 NEXT STEPS:');
  console.log('===============');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Check the Logs section for 500 errors');
  console.log('3. Look at the Authentication section to verify user sessions');
  console.log('4. Check the Database section for table structure and policies');
}

// Run the analysis
if (require.main === module) {
  analyzeSupabaseQueries();
}