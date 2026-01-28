/**
 * Sanitizes prompts to comply with content policy filters
 * Removes or replaces potentially problematic words/phrases
 */

const CONTENT_POLICY_WORDS = [
  // Explicit content
  /\b(nude|naked|explicit|nsfw|porn|sex|sexual|erotic)\b/gi,
  // Violence
  /\b(violence|blood|gore|kill|murder|weapon|gun|knife|sword)\b/gi,
  // Hate speech
  /\b(hate|racist|discrimination|offensive)\b/gi,
  // Other sensitive terms
  /\b(drug|alcohol|smoking|cigarette)\b/gi,
];

const REPLACEMENTS: Record<string, string> = {
  // Keep 'girl' and 'girls' as they're fine in advertising context
  // Only replace if in problematic context
};

/**
 * Sanitizes a prompt to comply with content policy
 * @param prompt - The original prompt
 * @returns Sanitized prompt safe for content policy
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return prompt || '';
  }

  let sanitized = prompt.trim();

  // Apply word replacements first
  for (const [word, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  }

  // Remove or neutralize content policy violations
  for (const pattern of CONTENT_POLICY_WORDS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Clean up extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Ensure prompt is not empty after sanitization
  if (!sanitized) {
    sanitized = 'Professional product advertisement video';
  }

  return sanitized;
}

/**
 * Sanitizes prompts for video generation (more strict)
 * Focuses on product/advertising content
 */
export function sanitizeVideoPrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return 'Professional product advertisement video';
  }

  let sanitized = prompt.trim();

  // Remove explicit content policy violations (keep advertising language)
  const explicitViolations = [
    /\b(nude|naked|explicit|nsfw|porn|sex|sexual|erotic)\b/gi,
    /\b(violence|blood|gore|kill|murder)\b/gi,
    /\b(hate|racist|discrimination)\b/gi,
  ];

  for (const pattern of explicitViolations) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Replace potentially problematic phrases in specific contexts
  // Only replace if they appear in problematic combinations
  sanitized = sanitized.replace(/\b(close.?up|intimate)\s+(of|on|with)\s+(body|skin|nude|naked)\b/gi, 'professional product shot');
  sanitized = sanitized.replace(/\b(touching|feeling)\s+(body|skin|nude|naked)\b/gi, 'applying product');

  // Clean up extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Ensure prompt is professional and not empty
  if (!sanitized || sanitized.length < 10) {
    sanitized = 'Professional product advertisement video';
  }

  // Add professional context prefix for advertising content
  if (!sanitized.toLowerCase().includes('advertisement') && !sanitized.toLowerCase().includes('ad')) {
    // Only add if it's clearly product-related
    if (sanitized.toLowerCase().includes('product') || sanitized.toLowerCase().includes('shampoo') || 
        sanitized.toLowerCase().includes('beauty') || sanitized.toLowerCase().includes('cosmetic')) {
      sanitized = `Professional advertisement: ${sanitized}`;
    }
  }

  return sanitized.trim();
}
