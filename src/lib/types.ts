export type Profile = {
  id: string;
  username: string;
  display_name: string;
  island: string;
  current_location: string;
  bio: string;
  avatar_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  x_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  looking_for: string | null;
  is_creator?: boolean;
};

export type Post = {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  island: string;
  posted_from: string;
  tags: string[];
  created_at: string;
  edited_at: string | null;
  profiles?: Profile;
  post_likes?: { user_id: string }[];
};

export type EventRow = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  city: string;
  venue: string | null;
  starts_at: string;
  category: string;
  event_rsvps?: { user_id: string }[];
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  kind: string;
  caribbean_owned: boolean;
  description: string;
  apply_url: string | null;
};

export type FamilyMember = {
  id: string;
  name: string;
  relation: string | null;
  place: string | null;
  born_year: number | null;
  parent_id: string | null;
};

export type CultureMusic = {
  id: string;
  author_id: string;
  title: string;
  artist: string;
  audio_url: string | null;
  external_url: string | null;
  created_at: string;
  profiles?: Profile;
};

export type CulturePoem = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  media_url: string | null;
  created_at: string;
  profiles?: Profile;
};

export type CultureStory = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  external_url: string | null;
  created_at: string;
  profiles?: Profile;
};

export type PropertyListing = {
  id: string;
  author_id: string;
  listing_type: string;       // 'land' | 'house'
  transaction_type: string;   // 'sale' | 'rent'
  island: string;
  location: string;
  price: string;
  description: string;
  photo_urls: string[];
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  created_at: string;
  profiles?: Profile;
};
