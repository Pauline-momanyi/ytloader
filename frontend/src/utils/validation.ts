export const parseTimestamp = (timestamp: string): number | null => {
  // Enforce rigid [H]H:MM:SS, MM:SS, or just SS (up to 2-3 digits max)
  // Rejects 000:000 or anything malformed.
  const regex = /^(?:(?:(\d{1,2}):)?([0-5]?\d):)?([0-5]?\d)$/;
  const match = timestamp.trim().match(regex);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  if (minutes >= 60 || seconds >= 60) return null;

  return hours * 3600 + minutes * 60 + seconds;
};

export const validateTimestamp = (fromStr: string, toStr: string, videoDurationSecs?: number): { valid: boolean; error?: string } => {
  if (!fromStr.trim() && !toStr.trim()) return { valid: true }; // empty is fine, means whole video

  const fromNum = fromStr.trim() ? parseTimestamp(fromStr) : 0;
  const toNum = toStr.trim() ? parseTimestamp(toStr) : (videoDurationSecs || Infinity);


  if (fromNum === null || toNum === null) {
    return { valid: false, error: "Invalid format. Use HH:MM:SS, MM:SS, or SS." };
  }

  if (fromNum < 0 || toNum < 0) {
    return { valid: false, error: "Timestamp cannot be negative." };
  }

  if (videoDurationSecs) {
    if (fromNum > videoDurationSecs || (toNum !== Infinity && toNum > videoDurationSecs)) {
      return { valid: false, error: "Timestamp cannot exceed video duration." };
    }
  }

  if (fromNum >= toNum && toStr.trim()) {
    return { valid: false, error: "'From' time must be before 'To' time." };
  }

  return { valid: true };
};
