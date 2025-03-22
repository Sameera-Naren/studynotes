/*
  # Update RLS policies for notes table

  1. Security Changes
    - Enable RLS on notes table if not already enabled
    - Add policies for authenticated users to:
      - Insert their own notes
      - Update their own notes
      - Delete their own notes
      - Read all notes
    
  Note: Uses DO blocks to check for existing policies before creating them
*/

-- Enable RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create insert policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND policyname = 'Users can create their own notes'
  ) THEN
    CREATE POLICY "Users can create their own notes"
    ON notes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create update policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND policyname = 'Users can update their own notes'
  ) THEN
    CREATE POLICY "Users can update their own notes"
    ON notes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create delete policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND policyname = 'Users can delete their own notes'
  ) THEN
    CREATE POLICY "Users can delete their own notes"
    ON notes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create select policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND policyname = 'Anyone can read notes'
  ) THEN
    CREATE POLICY "Anyone can read notes"
    ON notes
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;