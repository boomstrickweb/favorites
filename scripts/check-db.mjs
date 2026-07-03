import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing since dotenv isn't installed
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// NOTE: This script is for verifying the database schema.
// It uses the environment variables to connect to Supabase and check if the 'profiles' table exists.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking Supabase connection and schema...');
  
  try {
    // Attempt to select from the profiles table to see if it exists and is accessible
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table "profiles" DOES NOT exist in the public schema.');
        console.log('Please run the SQL script I provided in your Supabase SQL Editor.');
      } else {
        console.error('❌ Error checking profiles table:', error.message);
        console.log('Error code:', error.code);
      }
    } else {
      console.log('✅ Table "profiles" exists and is accessible!');
      console.log(`Found ${data.length} profile(s) in the table.`);
      if (data.length > 0) {
        console.log('Sample profile data:', data[0]);
      }
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
}

checkSchema();
