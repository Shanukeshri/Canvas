/**
 * Formats raw error objects, server exceptions, and Zod validation outputs
 * into clean, concise, few-worded user-friendly messages.
 */
export function formatErrorMessage(raw: unknown): string {
  if (!raw) return 'An error occurred';

  let rawStr = '';
  if (typeof raw === 'string') {
    rawStr = raw.trim();
  } else if (raw instanceof Error) {
    rawStr = raw.message.trim();
  } else if (typeof raw === 'object') {
    // Check if it's a ZodError object with errors array
    if ('errors' in (raw as any) && Array.isArray((raw as any).errors)) {
      const first = (raw as any).errors[0];
      if (first?.message) return cleanMessage(first.message);
    }
    // Check if it has a message property
    if ('message' in (raw as any) && typeof (raw as any).message === 'string') {
      rawStr = (raw as any).message.trim();
    } else {
      try {
        rawStr = JSON.stringify(raw);
      } catch {
        return 'Operation failed';
      }
    }
  }

  // Check if string is a JSON array (standard Zod error serialization)
  if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
    try {
      const parsed = JSON.parse(rawStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first?.message) {
          return cleanMessage(first.message);
        }
      }
    } catch {
      // Not JSON, continue
    }
  }

  // Check if string contains JSON array inside
  const jsonArrayMatch = rawStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonArrayMatch) {
    try {
      const parsed = JSON.parse(jsonArrayMatch[0]);
      if (Array.isArray(parsed) && parsed[0]?.message) {
        return cleanMessage(parsed[0].message);
      }
    } catch {
      // Continue
    }
  }

  // Handle common database / system messages
  if (rawStr.includes('Unique constraint failed on the constraint: `User_email_key`') ||
      rawStr.includes('Unique constraint failed on the fields: (`email`)') ||
      rawStr.toLowerCase().includes('email already exists')) {
    return 'Email already in use';
  }

  if (rawStr.includes('Unique constraint failed on the constraint: `User_handle_key`') ||
      rawStr.includes('Unique constraint failed on the fields: (`handle`)') ||
      rawStr.toLowerCase().includes('handle is already taken')) {
    return 'Handle already taken';
  }

  if (rawStr.toLowerCase().includes('invalid email or password')) {
    return 'Invalid email or password';
  }

  if (rawStr.toLowerCase().includes('failed to fetch') || rawStr.toLowerCase().includes('network')) {
    return 'Network connection failed';
  }

  return cleanMessage(rawStr);
}

function cleanMessage(msg: string): string {
  let cleaned = msg.trim();
  // Strip code names or JSON artifacts
  cleaned = cleaned.replace(/^Error:\s*/i, '');
  // If it's too long (> 60 chars), shorten to few words
  if (cleaned.length > 60) {
    const periodIdx = cleaned.indexOf('.');
    if (periodIdx > 10 && periodIdx <= 60) {
      cleaned = cleaned.substring(0, periodIdx);
    } else {
      const words = cleaned.split(' ');
      if (words.length > 7) {
        cleaned = words.slice(0, 6).join(' ');
      }
    }
  }
  return cleaned;
}
