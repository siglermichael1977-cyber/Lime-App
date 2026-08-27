// Users may paste either a bare handle ("@mikesigler") or a full URL.
// Normalize either into a real, tappable profile URL.
function normalizeHandleUrl(input: string, urlPrefix: string, useAtSign = false): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  return `${urlPrefix}${useAtSign ? '@' : ''}${handle}`;
}

export const instagramUrl = (v: string) => normalizeHandleUrl(v, 'https://instagram.com/');
export const facebookUrl = (v: string) => normalizeHandleUrl(v, 'https://facebook.com/');
export const tiktokUrl = (v: string) => normalizeHandleUrl(v, 'https://tiktok.com/', true);
export const xUrl = (v: string) => normalizeHandleUrl(v, 'https://x.com/');

export const whatsappUrl = (phoneOrNumber: string) => {
  const digits = phoneOrNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}`;
};

export const whatsappShareUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
