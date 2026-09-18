export interface CategoryItem {
  title: string;
  image?: string;
  color?: string;
  href?: string;
}

export interface CategoriesData {
  BROWSE: CategoryItem[];
  STUDIOS: CategoryItem[];
  LANGUAGES: CategoryItem[];
  SPORTS: CategoryItem[];
  GENRES: CategoryItem[];
  MAPS?: {
    ENDPOINTS?: Record<string, string>;
  };
}

export const FALLBACK_CATEGORIES: CategoriesData = {
  BROWSE: [
    { title: "Movies", image: "https://api.bingr.one/static/categories/Movie.webp", href: "/movies" },
    { title: "TV Shows", image: "https://api.bingr.one/static/categories/TV.webp", href: "/tv" },
    { title: "Anime", image: "https://api.bingr.one/static/categories/anime.webp", href: "/anime" },
    { title: "Sports", image: "https://api.bingr.one/static/categories/Sports.webp", href: "/sports" },
    { title: "Live TV", image: "https://api.bingr.one/static/categories/News.webp", href: "/live" },
  ],
  STUDIOS: [
    { title: "Netflix", image: "https://api.bingr.one/static/netflix.webp" },
    { title: "Disney Plus", image: "https://api.bingr.one/static/categories/1747996723703-a.webp" },
    { title: "HBO Max", image: "https://api.bingr.one/static/categories/1775539725531-a.webp" },
    { title: "Apple TV+", image: "https://api.bingr.one/static/apple-tv.webp" },
    { title: "Prime Video", image: "https://api.bingr.one/static/prime-video.webp" },
    { title: "Paramount", image: "https://api.bingr.one/static/categories/1739358280583-a.webp" },
    { title: "Peacock", image: "https://api.bingr.one/static/categories/1739359307816-a.webp" },
    { title: "Hulu", image: "https://api.bingr.one/static/hulu.webp" },
    { title: "Specials", image: "https://api.bingr.one/static/categories/1739441155598-a.webp" },
  ],
  LANGUAGES: [
    { title: "English", image: "https://api.bingr.one/static/categories/1526660-a-afdd1ecfd8ae.webp" },
    { title: "Japanese", image: "https://api.bingr.one/static/categories/1750233039896-a.webp" },
    { title: "Korean", image: "https://api.bingr.one/static/categories/1526670-a-ec8fb58a5fb8.webp" },
    { title: "Hindi", image: "https://api.bingr.one/static/categories/1526661-a-00b818b5bc0e.webp" },
    { title: "Spanish", image: "https://api.bingr.one/static/spanish.webp" },
    { title: "Portuguese", image: "https://api.bingr.one/static/portuguese.webp" },
    { title: "Tamil", image: "https://api.bingr.one/static/categories/1526682-a-fd4e220ba563.webp" },
    { title: "Telugu", image: "https://api.bingr.one/static/categories/1526685-a-5f5995a53f61.webp" },
    { title: "Kannada", image: "https://api.bingr.one/static/categories/1781241136059-a.webp" },
    { title: "Malayalam", image: "https://api.bingr.one/static/categories/1526672-a-eafe6913c6c8.webp" },
    { title: "Marathi", image: "https://api.bingr.one/static/categories/1526674-a-fdd5233a7699.webp" },
    { title: "Bengali", image: "https://api.bingr.one/static/categories/1526659-a-7271cf19114e.webp" },
  ],
  SPORTS: [
    { title: "Football", image: "https://api.bingr.one/static/categories/1534550-a-fc4b5ad51967.webp" },
    { title: "Cricket", image: "https://api.bingr.one/static/categories/1526630-a-9b9ea791cdaf.webp" },
    { title: "American Football", image: "https://api.bingr.one/static/categories/1526634-a-fbbbeb6daa07.webp" },
    { title: "Mixed Martial Arts", image: "https://api.bingr.one/static/categories/1526638-a-db7e5efc1703.webp" },
    { title: "Motorsports", image: "https://api.bingr.one/static/categories/1745908675037-a.webp" },
    { title: "Tennis", image: "https://api.bingr.one/static/categories/1526639-a-741d71091ea7.webp" },
    { title: "Badminton", image: "https://api.bingr.one/static/categories/1735026006470-a.webp" },
    { title: "ESports", image: "https://api.bingr.one/static/categories/1745908815213-a.webp" },
    { title: "Hockey", image: "https://api.bingr.one/static/categories/1526643-a-95b16247c411.webp" },
    { title: "Kabaddi", image: "https://api.bingr.one/static/categories/1526635-a-453e30065a30.webp" },
  ],
  GENRES: [
    { title: "Action", image: "https://api.bingr.one/static/categories/1535302-a-e90748391e0d.webp" },
    { title: "Adventure", image: "https://api.bingr.one/static/categories/1535301-a-9bb68bcd147c.webp" },
    { title: "Animation", image: "https://api.bingr.one/static/categories/1535299-a-e6296badeb14.webp" },
    { title: "Anime", image: "https://api.bingr.one/static/categories/1750239042025-a.webp" },
    { title: "Comedy", image: "https://api.bingr.one/static/categories/1535292-a-5739f9c84b63.webp" },
    { title: "Crime", image: "https://api.bingr.one/static/categories/1535288-a-690bac400aa1.webp" },
    { title: "Documentary", image: "https://api.bingr.one/static/categories/1535286-a-f282f00643b5.webp" },
    { title: "Drama", image: "https://api.bingr.one/static/categories/1535285-a-88035ca1ae69.webp" },
    { title: "Family", image: "https://api.bingr.one/static/categories/1535284-a-656c6b45a905.webp" },
    { title: "Fantasy", image: "https://api.bingr.one/static/categories/1535282-a-ae97739962dc.webp" },
    { title: "Historical", image: "https://api.bingr.one/static/categories/1535280-a-a1d64ccd7457.webp" },
    { title: "Horror", image: "https://api.bingr.one/static/categories/1535279-a-c92b487cb711.webp" },
    { title: "Musical", image: "https://api.bingr.one/static/categories/1535270-a-6a85b09721ab.webp" },
    { title: "Mystery", image: "https://api.bingr.one/static/categories/1535269-a-e0ed0b72ebe7.webp" },
    { title: "Romance", image: "https://api.bingr.one/static/categories/1750239101112-a.webp" },
    { title: "Sci-Fi", image: "https://api.bingr.one/static/categories/1535259-a-6e0b7daffb29.webp" },
    { title: "Superhero", image: "https://api.bingr.one/static/categories/1538364-a-a3b574f36633.webp" },
    { title: "Thriller", image: "https://api.bingr.one/static/categories/1535246-a-27373cc1a222.webp" },
    { title: "Biopic", image: "https://api.bingr.one/static/categories/1750239188589-a.webp" },
    { title: "Teen", image: "https://api.bingr.one/static/categories/1535248-a-35ccd1ea9ec0.webp" },
    { title: "Science and Technology", image: "https://api.bingr.one/static/categories/1568791-a-e50a43088a1a.webp" },
    { title: "Reality", image: "https://api.bingr.one/static/categories/1535264-a-9e7871687c76.webp" },
    { title: "Mythology", image: "https://api.bingr.one/static/categories/1535267-a-3cae422b372e.webp" },
    { title: "Travel", image: "https://api.bingr.one/static/categories/1535245-a-90839834c474.webp" },
  ],
};

// Genre mapping (TMDB ID string)
export const GENRE_MAP: Record<string, { movie: string; tv: string }> = {
  action: { movie: "28", tv: "10759" },
  adventure: { movie: "12", tv: "10759" },
  animation: { movie: "16", tv: "16" },
  anime: { movie: "16", tv: "16" },
  comedy: { movie: "35", tv: "35" },
  crime: { movie: "80", tv: "80" },
  documentary: { movie: "99", tv: "99" },
  drama: { movie: "18", tv: "18" },
  family: { movie: "10751", tv: "10751" },
  fantasy: { movie: "14", tv: "10765" },
  history: { movie: "36", tv: "36" },
  historical: { movie: "36", tv: "36" },
  horror: { movie: "27", tv: "27" },
  music: { movie: "10402", tv: "10402" },
  musical: { movie: "10402", tv: "10402" },
  mystery: { movie: "9648", tv: "9648" },
  romance: { movie: "10749", tv: "10749" },
  "sci-fi": { movie: "878", tv: "10765" },
  "science fiction": { movie: "878", tv: "10765" },
  superhero: { movie: "28,878", tv: "10759,10765" },
  thriller: { movie: "53", tv: "53" },
  war: { movie: "10752", tv: "10768" },
  western: { movie: "37", tv: "37" },
  biopic: { movie: "36,18", tv: "36,18" },
  reality: { movie: "99", tv: "10764" },
  mythology: { movie: "14,36", tv: "10765" },
  teen: { movie: "10751,35", tv: "10751,35" },
  "science and technology": { movie: "99,878", tv: "99,10765" },
  travel: { movie: "99", tv: "99" },
  lifestyle: { movie: "99", tv: "10764" },
};

// Studio network/company mapping for TMDB discover
export const STUDIO_MAP: Record<string, { company?: string; network?: string }> = {
  netflix: { company: "213", network: "213" },
  "disney plus": { company: "2", network: "2739" },
  disney: { company: "2", network: "2739" },
  "hbo max": { company: "3268", network: "3186" },
  hbo: { company: "3268", network: "49" },
  "apple tv+": { company: "2552", network: "2552" },
  "prime video": { company: "20580", network: "1024" },
  amazon: { company: "20580", network: "1024" },
  paramount: { company: "4", network: "4330" },
  "paramount plus": { company: "4", network: "4330" },
  peacock: { company: "3353", network: "3353" },
  hulu: { company: "429", network: "453" },
  specials: { company: "213" },
};

// Language code mapping (ISO 639-1)
export const LANGUAGE_MAP: Record<string, string> = {
  english: "en",
  japanese: "ja",
  korean: "ko",
  hindi: "hi",
  spanish: "es",
  portuguese: "pt",
  french: "fr",
  german: "de",
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
  malayalam: "ml",
  marathi: "mr",
  bengali: "bn",
};

export async function fetchCategoriesData(): Promise<CategoriesData> {
  try {
    const res = await fetch("https://api.bingr.one/api/categories", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        BROWSE: data.BROWSE?.length ? data.BROWSE : FALLBACK_CATEGORIES.BROWSE,
        STUDIOS: data.STUDIOS?.length ? data.STUDIOS : FALLBACK_CATEGORIES.STUDIOS,
        LANGUAGES: data.LANGUAGES?.length ? data.LANGUAGES : FALLBACK_CATEGORIES.LANGUAGES,
        SPORTS: data.SPORTS?.length ? data.SPORTS : FALLBACK_CATEGORIES.SPORTS,
        GENRES: data.GENRES?.length ? data.GENRES : FALLBACK_CATEGORIES.GENRES,
        MAPS: data.MAPS,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch live categories from Bingr, using curated fallback:", err);
  }
  return FALLBACK_CATEGORIES;
}
