// Content moderation utilities & positive environment guardians

const BANNED_PATTERNS = [
  /\b(hate|slur|scam|viagra|casino|nude|porn|crypto\s*bot|giveaway\s*free|free\s*bitcoin|kill|idiot|stupid|asshole|bitch|bastard|fuck|shit)\b/i,
  /\b(buy\s*now\s*at\s*https?:\/\/|t\.me\/|wa\.me\/)\b/i
];

export const ADMIN_EMAILS = [
  'nareshchandu27@gmail.com',
  'admin@floravia.botanical',
  'moderator@floravia.botanical'
];

export function isModerator(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export interface ContentSafetyResult {
  isSafe: boolean;
  flaggedKeywords: string[];
  warningMessage?: string;
  autoFlagReason?: 'profanity' | 'spam' | 'toxic';
}

export function checkContentSafety(text: string, title: string = ''): ContentSafetyResult {
  const combined = `${title} ${text}`.toLowerCase();
  const flaggedKeywords: string[] = [];

  for (const pattern of BANNED_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      flaggedKeywords.push(match[0]);
    }
  }

  // Excessively repetitive characters or spam links
  const hasSpamLinks = (combined.match(/https?:\/\//g) || []).length > 3;

  if (flaggedKeywords.length > 0) {
    return {
      isSafe: false,
      flaggedKeywords,
      warningMessage: `Your message contains restricted terminology (${flaggedKeywords.join(', ')}). Please adhere to our positive gardening community guidelines.`,
      autoFlagReason: 'toxic'
    };
  }

  if (hasSpamLinks) {
    return {
      isSafe: false,
      flaggedKeywords: ['excessive links'],
      warningMessage: 'Posts with excessive promotional links are held for moderator review.',
      autoFlagReason: 'spam'
    };
  }

  return {
    isSafe: true,
    flaggedKeywords: []
  };
}

export const COMMUNITY_GUIDELINES = [
  {
    title: 'Cultivate Kindness & Respect',
    description: 'Gardening is a shared passion for growth. Encourage beginners, praise flourishing gardens, and offer constructive advice.'
  },
  {
    title: 'Share Botanical Truths',
    description: 'Ensure plant care instructions and pest remedies are accurate. If unsure, mark your post as a question or request verification.'
  },
  {
    title: 'Authentic Garden Showcases',
    description: 'Share authentic photos from your garden, balcony, windowsill, or green spaces. Give credit if referencing external sources.'
  },
  {
    title: 'Zero Tolerance for Toxicity & Spam',
    description: 'Self-promotion, commercial spam, offensive language, and harassment are strictly moderated to maintain a welcoming sanctuary.'
  }
];
