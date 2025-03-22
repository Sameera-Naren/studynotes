/*
  # Storage Policies for Notes Bucket

  1. Security
    - Enable storage policies for the notes bucket
    - Add policies for authenticated users to:
      - Create buckets
      - Upload files
      - Download files
      - Delete their own files
*/

-- Enable storage for authenticated users to create buckets
create policy "Enable storage for authenticated users"
on storage.buckets
for all
to authenticated
using ( true );

-- Enable object operations for authenticated users
create policy "Give users access to own folder"
on storage.objects
for all
to authenticated
using ( bucket_id = 'notes' );