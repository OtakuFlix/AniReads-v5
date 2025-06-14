/*
  # Comments System Migration

  1. New Tables
    - `manga_comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `manga_id` (text, manga identifier)
      - `content` (text, comment content)
      - `likes_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comment_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `comment_id` (uuid, references manga_comments)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to comments
*/

-- Create manga_comments table
CREATE TABLE IF NOT EXISTS manga_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manga_id text NOT NULL,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id uuid REFERENCES manga_comments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE manga_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON manga_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON manga_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON manga_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON manga_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own comment likes"
  ON comment_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manga_comments_manga_id ON manga_comments(manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_comments_user_id ON manga_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_manga_comments_created_at ON manga_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE manga_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE manga_comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for likes count
CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Create trigger for updated_at on comments
CREATE TRIGGER update_manga_comments_updated_at
  BEFORE UPDATE ON manga_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();