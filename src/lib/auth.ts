import { supabase } from './supabase';

export interface ProfileData {
  name: string;
  blood_group: string;
  last_donation_date: string | null;
  location: string;
  phone: string;
}

/**
 * Sign up a new user. 
 * We pass profile data as metadata so the DB trigger can create the profile record 
 * even if email confirmation is required.
 */
export const signUpUser = async (email: string, password: string, profile: ProfileData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: profile.name,
        blood_group: profile.blood_group,
        location: profile.location,
        phone: profile.phone,
      }
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।');
    }
    throw authError;
  }

  return authData;
};

/**
 * Sign in an existing user.
 */
export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      throw new Error('আপনার ইমেইলটি এখনো ভেরিফাই করা হয়নি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।');
    }
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
    }
    throw error;
  }
  return data;
};

/**
 * Sign out the current user.
 */
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Fetch the current user's profile.
 */
export const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};
