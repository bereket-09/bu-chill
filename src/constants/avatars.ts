export interface AvatarItem {
  id: string;
  name: string;
  url: string;
  category: "classic" | "characters" | "illustrated";
}

export const DEFAULT_AVATAR_ID = "01";
export const DEFAULT_AVATAR_URL = "/avatars/01.png";

export const AVATAR_PRESETS: AvatarItem[] = [
  // Classic & Default Netflix-style Smiley
  { id: "01", name: "Smile Gradient (Default)", url: "/avatars/01.png", category: "classic" },

  // Characters (Disney, Marvel, Pixar, Star Wars, DreamWorks)
  { id: "02", name: "Lightning McQueen", url: "/avatars/02.png", category: "characters" },
  { id: "03", name: "Buzz Lightyear", url: "/avatars/03.png", category: "characters" },
  { id: "04", name: "Jack-Jack", url: "/avatars/04.png", category: "characters" },
  { id: "05", name: "Minnie Mouse", url: "/avatars/05.png", category: "characters" },
  { id: "06", name: "Mirabel", url: "/avatars/06.png", category: "characters" },
  { id: "07", name: "Joe Gardner", url: "/avatars/07.png", category: "characters" },
  { id: "08", name: "Grogu (Baby Yoda)", url: "/avatars/08.png", category: "characters" },
  { id: "09", name: "Loki", url: "/avatars/09.png", category: "characters" },
  { id: "10", name: "Wanda Maximoff", url: "/avatars/10.png", category: "characters" },
  { id: "11", name: "Iron Man", url: "/avatars/11.png", category: "characters" },
  { id: "12", name: "Black Panther", url: "/avatars/12.png", category: "characters" },
  { id: "13", name: "Simba", url: "/avatars/13.png", category: "characters" },
  { id: "14", name: "Shang-Chi", url: "/avatars/14.png", category: "characters" },
  { id: "15", name: "Moana", url: "/avatars/15.png", category: "characters" },
  { id: "16", name: "Po Panda", url: "/avatars/16.png", category: "characters" },
  { id: "17", name: "The Mandalorian", url: "/avatars/17.png", category: "characters" },
  { id: "18", name: "Penguin", url: "/avatars/18.png", category: "characters" },
  { id: "19", name: "Olaf", url: "/avatars/19.png", category: "characters" },
  { id: "20", name: "Stitch", url: "/avatars/20.png", category: "characters" },
  { id: "21", name: "Woody", url: "/avatars/21.png", category: "characters" },
  { id: "22", name: "Nemo", url: "/avatars/22.png", category: "characters" },
  { id: "23", name: "Doctor Strange", url: "/avatars/23.png", category: "characters" },
  { id: "24", name: "Thor", url: "/avatars/24.png", category: "characters" },
  { id: "25", name: "Groot", url: "/avatars/25.png", category: "characters" },
  { id: "26", name: "Spider-Man", url: "/avatars/26.png", category: "characters" },
  { id: "27", name: "Captain America", url: "/avatars/27.png", category: "characters" },
  { id: "28", name: "Hulk", url: "/avatars/28.png", category: "characters" },

  // Illustrated Adventurers
  { id: "g01", name: "Shashi", url: "/avatars/g01.svg", category: "illustrated" },
  { id: "g02", name: "Kiddo", url: "/avatars/g02.svg", category: "illustrated" },
  { id: "g03", name: "Mickey", url: "/avatars/g03.svg", category: "illustrated" },
  { id: "g04", name: "Loki Adventurer", url: "/avatars/g04.svg", category: "illustrated" },
  { id: "g05", name: "Thor Adventurer", url: "/avatars/g05.svg", category: "illustrated" },
  { id: "g06", name: "Hulk Adventurer", url: "/avatars/g06.svg", category: "illustrated" },
  { id: "g07", name: "Spider Adventurer", url: "/avatars/g07.svg", category: "illustrated" },
  { id: "g08", name: "Strange Adventurer", url: "/avatars/g08.svg", category: "illustrated" },
  { id: "g09", name: "Nova", url: "/avatars/g09.svg", category: "illustrated" },
  { id: "g10", name: "Aria", url: "/avatars/g10.svg", category: "illustrated" },
  { id: "g11", name: "Kai", url: "/avatars/g11.svg", category: "illustrated" },
  { id: "g12", name: "Zara", url: "/avatars/g12.svg", category: "illustrated" },
];

/**
 * Resolves an avatar identifier or URL into a displayable image URL.
 * Falls back to the default smiley face avatar (`/avatars/01.png`).
 */
export function resolveAvatarUrl(avatarIdOrUrl?: string | null): string {
  if (!avatarIdOrUrl) return DEFAULT_AVATAR_URL;
  if (avatarIdOrUrl.startsWith("/") || /^https?:\/\//.test(avatarIdOrUrl)) {
    return avatarIdOrUrl;
  }
  const match = AVATAR_PRESETS.find((p) => p.id === avatarIdOrUrl);
  return match?.url || DEFAULT_AVATAR_URL;
}
