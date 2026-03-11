/**
 * SUPABASE SQL SCHEMA
 * 
 * Run these commands in your Supabase SQL Editor to set up the database.
 */

/*
-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  last_donation_date DATE,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Blood Requests Table
CREATE TABLE blood_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blood_group TEXT NOT NULL,
  location TEXT NOT NULL,
  hospital TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal' NOT NULL, -- 'Normal', 'Urgent', 'Critical'
  status TEXT DEFAULT 'Open' NOT NULL, -- 'Open', 'Fulfilled', 'Cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles: Users can view all profiles (to find donors), but only update their own.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Everyone can see posts, only owners can create/delete.
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts." ON posts FOR DELETE USING (auth.uid() = user_id);

-- Blood Requests: Everyone can see requests, only owners can manage.
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blood requests are viewable by everyone." ON blood_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create requests." ON blood_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own requests." ON blood_requests FOR UPDATE USING (auth.uid() = requester_id);

-- Enable Realtime for blood_requests
ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
*/
