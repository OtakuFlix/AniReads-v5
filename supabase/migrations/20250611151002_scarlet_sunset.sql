/*
  # User Library System Migration

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_manga_library`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `manga_id` (text, manga identifier from API)
      - `manga_title` (text)
      - `manga_slug` (text)
      - `poster_url` (text)
      - `status` (enum: reading, plan_to_read, on_hold, dropped, completed, re_reading)
      - `custom_list_id` (uuid, references custom_lists, nullable)
      - `progress` (integer, current chapter)
      - `total_chapters` (integer, nullable)
      - `rating` (integer, 1-10, nullable)
      - `notes` (text, nullable)
      - `started_at` (timestamp, nullable)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `custom_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text, nullable)
      - `is_public` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public access to public custom lists
*/

-- Create custom types
CREATE TYPE reading_status AS ENUM (
  'reading',
  'plan_to_read', 
  'on_hold',
  'dropped',
  'completed',
  're_reading'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create custom_lists table
CREATE TABLE IF NOT EXISTS custom_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_manga_library table
CREATE TABLE IF NOT EXISTS user_manga_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manga_id text NOT NULL,
  manga_title text NOT NULL,
  manga_slug text NOT NULL,
  poster_url text,
  status reading_status NOT NULL DEFAULT 'plan_to_read',
  custom_list_id uuid REFERENCES custom_lists(id) ON DELETE SET NULL,
  progress integer DEFAULT 0,
  total_chapters integer,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_manga_library ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Custom lists policies
CREATE POLICY "Users can view own custom lists"
  ON custom_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public custom lists"
  ON custom_lists
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can manage own custom lists"
  ON custom_lists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User manga library policies
CREATE POLICY "Users can view own library"
  ON user_manga_library
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own library"
  ON user_manga_library
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_manga_library_user_id ON user_manga_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_manga_library_status ON user_manga_library(status);
CREATE INDEX IF NOT EXISTS idx_user_manga_library_manga_id ON user_manga_library(manga_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_public ON custom_lists(is_public) WHERE is_public = true;

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_lists_updated_at
  BEFORE UPDATE ON custom_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_manga_library_updated_at
  BEFORE UPDATE ON user_manga_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();