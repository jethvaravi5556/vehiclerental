// Simple utility for className concatenation
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}