/*
  # Add RLS policies for notes table

  1. Security Changes
    - Enable RLS on notes table
    - Add policies for authenticated users to:
      - Insert their own notes
      - Update their own notes
      - Delete their own notes
      - Read all notes
*/

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own notes
CREATE POLICY "Users can create their own notes"
ON notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own notes
CREATE POLICY "Users can update their own notes"
ON notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own notes
CREATE POLICY "Users can delete their own notes"
ON notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to read all notes
CREATE POLICY "Anyone can read notes"
ON notes
FOR SELECT
TO authenticated
USING (true);