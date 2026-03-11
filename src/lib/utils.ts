import { differenceInDays, addDays, format } from 'date-fns';

/**
 * Logic to calculate if a user is eligible to donate.
 * Standard interval is 120 days.
 */
export const checkEligibility = (lastDonationDate: string | null) => {
  if (!lastDonationDate) {
    return {
      isEligible: true,
      nextAvailableDate: null,
      daysRemaining: 0,
    };
  }

  const lastDate = new Date(lastDonationDate);
  const today = new Date();
  const daysSinceLast = differenceInDays(today, lastDate);
  const eligibilityInterval = 120;

  if (daysSinceLast >= eligibilityInterval) {
    return {
      isEligible: true,
      nextAvailableDate: null,
      daysRemaining: 0,
    };
  }

  const nextDate = addDays(lastDate, eligibilityInterval);
  return {
    isEligible: false,
    nextAvailableDate: format(nextDate, 'yyyy-MM-dd'),
    daysRemaining: eligibilityInterval - daysSinceLast,
  };
};

/**
 * Social Sharing Helper
 */
export const getShareLinks = (requestId: string, bloodGroup: string, location: string) => {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const shareUrl = `${appUrl}/request/${requestId}`;
  const text = `জরুরি রক্তের প্রয়োজন! রক্তদাতা খুঁজছি।\nগ্রুপ: ${bloodGroup}\nস্থান: ${location}\nবিস্তারিত দেখুন: ${shareUrl}`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
  };
};
