import {
  resolveIptvCountry,
  ResolvedCountry,
  IPTV_COUNTRIES,
  getIptvCountryPlaylistUrl,
} from "@/constants/iptvCountries";

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  group: string;
  category?: string;
  url: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  language?: string;
  tvgId?: string;
  epgUrl?: string;
}

export const CHANNEL_CATEGORIES = [
  "All",
  "Favorites",
  "News",
  "Sports",
  "Movies",
  "Entertainment",
  "Music",
  "Documentary",
  "Kids",
] as const;

export type ChannelCategory = (typeof CHANNEL_CATEGORIES)[number];

/**
 * Normalizes raw M3U group-title tags (which often contain multiple semicolon-delimited
 * categories like "Kids;Sports" or "News;Weather") into one of the canonical ChannelCategory values.
 */
export function normalizeCategory(rawGroup?: string): ChannelCategory {
  if (!rawGroup) return "Entertainment";
  const str = String(rawGroup).trim();
  if (!str) return "Entertainment";

  // Check if string directly matches a known category
  for (const cat of CHANNEL_CATEGORIES) {
    if (cat.toLowerCase() === str.toLowerCase()) return cat;
  }

  // Split multiple groups separated by semicolon, comma, slash, or pipe
  const parts = str.split(/[;,/|]/).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const g = part.toLowerCase();
    if (
      g.includes("news") ||
      g.includes("weather") ||
      g.includes("business") ||
      g.includes("politics") ||
      g.includes("info") ||
      g.includes("finance")
    ) {
      return "News";
    }
    if (
      g.includes("sport") ||
      g.includes("racing") ||
      g.includes("motor") ||
      g.includes("golf") ||
      g.includes("fight") ||
      g.includes("wrestling") ||
      g.includes("combat") ||
      g.includes("mma") ||
      g.includes("football") ||
      g.includes("soccer") ||
      g.includes("basketball") ||
      g.includes("baseball") ||
      g.includes("tennis") ||
      g.includes("athletics")
    ) {
      return "Sports";
    }
    if (
      g.includes("movie") ||
      g.includes("cinema") ||
      g.includes("film") ||
      g.includes("action") ||
      g.includes("thriller") ||
      g.includes("classic") ||
      g.includes("western")
    ) {
      return "Movies";
    }
    if (
      g.includes("kid") ||
      g.includes("child") ||
      g.includes("animation") ||
      g.includes("cartoon") ||
      g.includes("family") ||
      g.includes("anime") ||
      g.includes("disney") ||
      g.includes("junior")
    ) {
      return "Kids";
    }
    if (
      g.includes("music") ||
      g.includes("song") ||
      g.includes("radio") ||
      g.includes("mtv") ||
      g.includes("hits") ||
      g.includes("pop") ||
      g.includes("rock")
    ) {
      return "Music";
    }
    if (
      g.includes("documentary") ||
      g.includes("history") ||
      g.includes("science") ||
      g.includes("nature") ||
      g.includes("travel") ||
      g.includes("wildlife") ||
      g.includes("discovery") ||
      g.includes("culture") ||
      g.includes("education")
    ) {
      return "Documentary";
    }
    if (
      g.includes("entertainment") ||
      g.includes("series") ||
      g.includes("drama") ||
      g.includes("comedy") ||
      g.includes("variety") ||
      g.includes("show") ||
      g.includes("general") ||
      g.includes("reality")
    ) {
      return "Entertainment";
    }
  }

  // Fallback checks on entire string
  const lower = str.toLowerCase();
  if (lower.includes("news")) return "News";
  if (lower.includes("sport")) return "Sports";
  if (lower.includes("movie") || lower.includes("film")) return "Movies";
  if (lower.includes("kid") || lower.includes("child") || lower.includes("animation") || lower.includes("cartoon")) return "Kids";
  if (lower.includes("music")) return "Music";
  if (lower.includes("documentary")) return "Documentary";

  return "Entertainment";
}

// High-reliability curated public HLS streams
const RAW_CURATED_CHANNELS: Channel[] = [
  // --- NEWS ---
  {
    id: "sky-news-uk",
    name: "Sky News",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/sky.com/sky.com.png",
    group: "News",
    country: "UK",
    language: "English",
    url: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8",
  },
  {
    id: "dw-english",
    name: "DW English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/dw.com/dw.com.png",
    group: "News",
    country: "Germany",
    language: "English",
    url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
  },
  {
    id: "cgtn-news",
    name: "CGTN News",
    logo: "https://i.imgur.com/DrrlxTO.png",
    group: "News",
    country: "Global",
    language: "English",
    url: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8",
  },
  {
    id: "bloomberg-originals",
    name: "Bloomberg Originals",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/bloomberg.com/bloomberg.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://dai.google.com/linear/hls/event/jKwfd4apQcuxQtyRI9Q6-Q/master.m3u8",
  },
  {
    id: "al-jazeera-english",
    name: "Al Jazeera English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/aljazeera.com/aljazeera.com.png",
    group: "News",
    country: "Global",
    language: "English",
    url: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8",
  },
  {
    id: "france-24-english",
    name: "France 24 English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/france24.com/france24.com.png",
    group: "News",
    country: "France",
    language: "English",
    url: "https://live.france24.com/hls/live/2037218-b/F24_EN_HI_HLS/master_5000.m3u8",
  },

  // --- SPORTS ---
  {
    id: "cbs-sports-golazo",
    name: "CBS Sports Golazo Network",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cbssports.com/cbssports.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://dai.google.com/linear/hls/event/7f3Wv6f7QEKfQna22jHqLQ/master.m3u8",
  },
  {
    id: "redbull-tv",
    name: "Red Bull TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/redbull.com/redbull.com.png",
    group: "Sports",
    country: "Austria",
    language: "English",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_928.m3u8",
  },
  {
    id: "30a-golf",
    name: "30A Golf Kingdom",
    logo: "https://i.imgur.com/Lv53nh4.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://30a-tv.com/feeds/vidaa/golf.m3u8",
  },
  {
    id: "acc-network",
    name: "ACC Digital Network",
    logo: "https://i.imgur.com/V6Kaqha.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://raycom-accdn-firetv.amagi.tv/playlist.m3u8",
  },

  // --- MOVIES & ENTERTAINMENT ---
  {
    id: "48-hours",
    name: "48 Hours",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cbs.com/cbs.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://dai.google.com/linear/hls/event/JUr94WL2QAiVpGNHY5n5dA/master.m3u8",
  },
  {
    id: "50-cent-action",
    name: "50 Cent Action Cinema",
    logo: "https://i.imgur.com/pxFamLr.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://jmp2.uk/plu-68487fb3f212bedacf5a53e3.m3u8",
  },
  {
    id: "classic-movies",
    name: "30A TV Classic Movies",
    logo: "https://i.imgur.com/pxFamLr.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://30a-tv.com/feeds/pzaz/30atvmovies.m3u8",
  },
  {
    id: "anime-hidive",
    name: "ANIME x HIDIVE",
    logo: "https://i.imgur.com/pxFamLr.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://jmp2.uk/plu-6793eaa4bc03978b9bc63db1.m3u8",
  },
  {
    id: "avatar-channel",
    name: "Avatar Channel",
    logo: "https://i.imgur.com/pxFamLr.png",
    group: "Kids",
    country: "US",
    language: "English",
    url: "https://jmp2.uk/plu-656df599c0fc8800089c75ab.m3u8",
  },

  // --- SCIENCE & DOCUMENTARY ---
  {
    id: "nasa-tv-hd",
    name: "NASA TV HD",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/nasa.gov/nasa.gov.png",
    group: "Documentary",
    country: "US",
    language: "English",
    url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
  },
  {
    id: "weathernation",
    name: "WeatherNation",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/weathernationtv.com/weathernationtv.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://weathernation.akamaized.net/hls/live/2042186/wn/master.m3u8",
  },

  // --- SPORTS ---
  {
    id: "redbull-tv",
    name: "Red Bull TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/redbull.tv/redbull.tv.png",
    group: "Sports",
    country: "Austria",
    language: "English",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  },
  {
    id: "stadium-sports",
    name: "Stadium Sports",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/watchstadium.com/watchstadium.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://stadium-sinclair-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "sportsgrid",
    name: "SportsGrid",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/sportsgrid.com/sportsgrid.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://sportsgrid-sportsgrid-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "world-poker-tour",
    name: "World Poker Tour",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/worldpokertour.com/worldpokertour.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://worldpokertour-wpt-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "fight-network",
    name: "Fight Network",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/fightnetwork.com/fightnetwork.com.png",
    group: "Sports",
    country: "Canada",
    language: "English",
    url: "https://fightnetwork-fightnetwork-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "outdoor-america",
    name: "Outdoor America",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/outdooramerica.tv/outdooramerica.tv.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://outdooramerica-outdooramerica-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "acc-digital-network",
    name: "ACC Digital Network",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/theacc.com/theacc.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://accdn-sinclair-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "racing-america",
    name: "Racing America",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/racingamerica.com/racingamerica.com.png",
    group: "Sports",
    country: "US",
    language: "English",
    url: "https://racingamerica-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },

  // --- MOVIES ---
  {
    id: "filmrise-free-movies",
    name: "FilmRise Free Movies",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/filmrise.com/filmrise.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://filmrise-freemovies-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "cinevault-classics",
    name: "Cinevault Classics",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cinevault.tv/cinevault.tv.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://cinevault-classics-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "cinevault-westerns",
    name: "Cinevault Westerns",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cinevault.tv/cinevault.tv.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://cinevault-westerns-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "filmrise-action",
    name: "FilmRise Action",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/filmrise.com/filmrise.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://filmrise-action-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "filmrise-scifi",
    name: "FilmRise Sci-Fi",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/filmrise.com/filmrise.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://filmrise-scifi-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "dust-scifi",
    name: "Dust Sci-Fi",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/watchdust.com/watchdust.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://dust-dust-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "shout-factory-tv",
    name: "Shout! Factory TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/shoutfactorytv.com/shoutfactorytv.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://shoutfactory-shoutfactory-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "gravitas-movies",
    name: "Gravitas Movies",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/gravitasventures.com/gravitasventures.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://gravitas-gravitasmovies-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "hi-yah-martial-arts",
    name: "Hi-YAH! Martial Arts",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/hiyahtv.com/hiyahtv.com.png",
    group: "Movies",
    country: "US",
    language: "English",
    url: "https://hiyah-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },

  // --- ENTERTAINMENT ---
  {
    id: "failarmy",
    name: "FailArmy",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/failarmy.com/failarmy.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://failarmy-failarmy-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "the-pet-collective",
    name: "The Pet Collective",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/thepetcollective.com/thepetcollective.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://thepetcollective-thepetcollective-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "wipeout",
    name: "Wipeout Xtra",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/wipeout.tv/wipeout.tv.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://wipeout-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "mst3k",
    name: "Mystery Science Theater 3000",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/mst3k.com/mst3k.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://mst3k-shoutfactory-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "comedy-dynamics",
    name: "Comedy Dynamics",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/comedydynamics.com/comedydynamics.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://comedydynamics-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "bob-ross-channel",
    name: "The Bob Ross Channel",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/bobross.com/bobross.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://bobross-cinedigm-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "forensic-files",
    name: "Forensic Files",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/forensicfiles.com/forensicfiles.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://forensicfiles-filmrise-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "unsolved-mysteries",
    name: "Unsolved Mysteries",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/unsolved.com/unsolved.com.png",
    group: "Entertainment",
    country: "US",
    language: "English",
    url: "https://unsolvedmysteries-filmrise-1-us.roku.wurl.tv/playlist.m3u8",
  },

  // --- MUSIC ---
  {
    id: "vevo-pop",
    name: "Vevo Pop",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/vevo.com/vevo.com.png",
    group: "Music",
    country: "US",
    language: "English",
    url: "https://vevopop-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "vevo-hiphop",
    name: "Vevo Hip-Hop",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/vevo.com/vevo.com.png",
    group: "Music",
    country: "US",
    language: "English",
    url: "https://vevohiphop-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "clubbing-tv",
    name: "Clubbing TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/clubbingtv.com/clubbingtv.com.png",
    group: "Music",
    country: "France",
    language: "English",
    url: "https://clubbingtv-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "qello-concerts",
    name: "Qello Concerts",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/qello.com/qello.com.png",
    group: "Music",
    country: "US",
    language: "English",
    url: "https://qello-qelloconcerts-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "deluxe-lounge",
    name: "Deluxe Lounge",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/deluxemusic.tv/deluxemusic.tv.png",
    group: "Music",
    country: "Germany",
    language: "Music",
    url: "https://deluxelounge-rakuten-1-de.rakuten.wurl.tv/playlist.m3u8",
  },

  // --- DOCUMENTARY ---
  {
    id: "nasa-tv-hd",
    name: "NASA TV HD",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/nasa.gov/nasa.gov.png",
    group: "Documentary",
    country: "US",
    language: "English",
    url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
  },
  {
    id: "timeline-history",
    name: "Timeline Documentary",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/timelinehistory.com/timelinehistory.com.png",
    group: "Documentary",
    country: "UK",
    language: "English",
    url: "https://timeline-littledot-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "real-stories",
    name: "Real Stories",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/realstories.com/realstories.com.png",
    group: "Documentary",
    country: "UK",
    language: "English",
    url: "https://realstories-littledot-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "magellantv-now",
    name: "MagellanTV Now",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/magellantv.com/magellantv.com.png",
    group: "Documentary",
    country: "US",
    language: "English",
    url: "https://magellantv-magellantvnow-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "docurama",
    name: "Docurama",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/docurama.com/docurama.com.png",
    group: "Documentary",
    country: "US",
    language: "English",
    url: "https://docurama-cinedigm-1-us.roku.wurl.tv/playlist.m3u8",
  },

  // --- KIDS ---
  {
    id: "pokemon-tv",
    name: "Pokémon TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/pokemon.com/pokemon.com.png",
    group: "Kids",
    country: "Japan",
    language: "English",
    url: "https://pokemon-wildbrain-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "ducktv",
    name: "DuckTV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/ducktv.tv/ducktv.tv.png",
    group: "Kids",
    country: "Slovakia",
    language: "English",
    url: "https://ducktv-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "toon-goggles",
    name: "Toon Goggles",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/toongoggles.com/toongoggles.com.png",
    group: "Kids",
    country: "US",
    language: "English",
    url: "https://toongoggles-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "cartoon-classics",
    name: "Cartoon Classics",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cartoonclassics.com/cartoonclassics.com.png",
    group: "Kids",
    country: "US",
    language: "English",
    url: "https://cartoonclassics-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
  {
    id: "lego-channel",
    name: "LEGO Channel",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/lego.com/lego.com.png",
    group: "Kids",
    country: "US",
    language: "English",
    url: "https://lego-distro-1-us.roku.wurl.tv/playlist.m3u8",
  },
];

export const CURATED_CHANNELS: Channel[] = RAW_CURATED_CHANNELS.map((ch) => {
  const resolved = resolveIptvCountry({
    tvgCountry: ch.country,
    tvgId: ch.id,
    groupTitle: ch.group,
    channelName: ch.name,
    defaultCountry: ch.country,
  });
  return {
    ...ch,
    country: resolved.name,
    countryCode: resolved.code,
    countryFlag: resolved.flag,
  };
});

export interface M3UPlaylistPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  badge?: string;
  channelCountEstimate?: string;
  featured?: boolean;
}

export const POPULAR_M3U_PLAYLISTS: M3UPlaylistPreset[] = [
  {
    id: "pluto-tv-us",
    name: "Pluto TV 24/7 FAST Channels",
    description: "300+ free linear FAST channels: Paramount Movies, Showtime, MTV, CBS News, Comedy Central & Crime",
    category: "General",
    url: "https://raw.githubusercontent.com/NasiLemakk/Pluto-TV-Playlists/main/output/plutotv_us.m3u8",
    badge: "⭐ Pluto TV",
    channelCountEstimate: "350+",
    featured: true,
  },
  {
    id: "free-tv-movies",
    name: "Free-TV Movies & Cinema",
    description: "Curated 24/7 movies, FilmRise, Pluto Movies, cult cinema & Hollywood classics",
    category: "Movies",
    url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_movies.m3u8",
    badge: "🎬 FAST Movies",
    channelCountEstimate: "200+",
    featured: true,
  },
  {
    id: "iptv-all-countries",
    name: "IPTV-Org Master (All Countries)",
    description: "Global broadcast index of 5,000+ live linear TV channels across 150+ countries worldwide",
    category: "Global",
    url: "https://iptv-org.github.io/iptv/index.country.m3u",
    badge: "150+ Countries",
    channelCountEstimate: "5,000+",
    featured: true,
  },
  {
    id: "iptv-index",
    name: "IPTV-Org Global Index",
    description: "Direct master catalog from iptv-org containing all verified global channels",
    category: "Global",
    url: "https://iptv-org.github.io/iptv/index.m3u",
    badge: "Global Index",
    channelCountEstimate: "4,000+",
    featured: true,
  },
  {
    id: "iptv-eng",
    name: "English Channels (Global)",
    description: "Curated collection of 1,000+ English broadcast channels worldwide",
    category: "General",
    url: "https://iptv-org.github.io/iptv/languages/eng.m3u",
    badge: "Popular",
    channelCountEstimate: "1,500+",
    featured: true,
  },
  {
    id: "iptv-movies",
    name: "Movies & Cinema (24/7)",
    description: "Free 24/7 movie channels, indie films, Hollywood classics & action cinema",
    category: "Movies",
    url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
    badge: "Movies",
    channelCountEstimate: "400+",
    featured: true,
  },
  {
    id: "iptv-news",
    name: "24/7 Global News Network",
    description: "Top international networks: Sky News, DW, France 24, CGTN, Al Jazeera",
    category: "News",
    url: "https://iptv-org.github.io/iptv/categories/news.m3u",
    badge: "News",
    channelCountEstimate: "600+",
    featured: true,
  },
  {
    id: "iptv-sports",
    name: "Live Sports & Action",
    description: "Sports, combat, motorsports, golf, extreme athletics & highlights",
    category: "Sports",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    badge: "Sports",
    channelCountEstimate: "250+",
    featured: true,
  },
  {
    id: "iptv-animation",
    name: "Animation & Kids",
    description: "Cartoons, anime series, family programs & animated adventures",
    category: "Kids",
    url: "https://iptv-org.github.io/iptv/categories/animation.m3u",
    badge: "Kids & Anime",
    channelCountEstimate: "180+",
  },
  {
    id: "iptv-doc",
    name: "Documentary & Nature",
    description: "Science, space, history, wildlife and investigative documentaries",
    category: "Documentary",
    url: "https://iptv-org.github.io/iptv/categories/documentary.m3u",
    badge: "Docs",
    channelCountEstimate: "150+",
  },
  {
    id: "iptv-music",
    name: "Music & Concerts",
    description: "24/7 music channels across pop, rock, electronic, jazz & hip-hop",
    category: "Music",
    url: "https://iptv-org.github.io/iptv/categories/music.m3u",
    badge: "Music",
    channelCountEstimate: "300+",
  },
  {
    id: "free-tv-global",
    name: "Free-TV Curated Worldwide",
    description: "Tested free-to-air public broadcasts worldwide from Free-TV project",
    category: "General",
    url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8",
    badge: "Global",
    channelCountEstimate: "1,200+",
  },
  {
    id: "iptv-us",
    name: "United States (US Live TV)",
    description: "Local, regional, and national free streams from the United States",
    category: "US",
    url: "https://iptv-org.github.io/iptv/countries/us.m3u",
    badge: "🇺🇸 US",
    channelCountEstimate: "800+",
  },
  {
    id: "iptv-uk",
    name: "United Kingdom (UK Live TV)",
    description: "Public and digital channels broadcasting across the United Kingdom",
    category: "UK",
    url: "https://iptv-org.github.io/iptv/countries/uk.m3u",
    badge: "🇬🇧 UK",
    channelCountEstimate: "200+",
  },
  {
    id: "iptv-ca",
    name: "Canada (CA Live TV)",
    description: "Broadcast networks and local stations across Canadian provinces",
    category: "Canada",
    url: "https://iptv-org.github.io/iptv/countries/ca.m3u",
    badge: "🇨🇦 CA",
    channelCountEstimate: "150+",
  },
  {
    id: "iptv-de",
    name: "Germany (DE Live TV)",
    description: "Public broadcasters and linear channels across Germany",
    category: "Germany",
    url: "https://iptv-org.github.io/iptv/countries/de.m3u",
    badge: "🇩🇪 DE",
    channelCountEstimate: "180+",
  },
  {
    id: "iptv-fr",
    name: "France (FR Live TV)",
    description: "National and regional French television channels",
    category: "France",
    url: "https://iptv-org.github.io/iptv/countries/fr.m3u",
    badge: "🇫🇷 FR",
    channelCountEstimate: "120+",
  },
  {
    id: "iptv-es",
    name: "Spain (ES Live TV)",
    description: "Spanish national, autonomic and regional channels",
    category: "Spain",
    url: "https://iptv-org.github.io/iptv/countries/es.m3u",
    badge: "🇪🇸 ES",
    channelCountEstimate: "140+",
  },
  {
    id: "iptv-it",
    name: "Italy (IT Live TV)",
    description: "Italian national and local digital linear channels",
    category: "Italy",
    url: "https://iptv-org.github.io/iptv/countries/it.m3u",
    badge: "🇮🇹 IT",
    channelCountEstimate: "110+",
  },
  {
    id: "iptv-au",
    name: "Australia (AU Live TV)",
    description: "Australian terrestrial, news and entertainment broadcasts",
    category: "Australia",
    url: "https://iptv-org.github.io/iptv/countries/au.m3u",
    badge: "🇦🇺 AU",
    channelCountEstimate: "90+",
  },
  {
    id: "iptv-in",
    name: "India (IN Live TV)",
    description: "National and regional Indian language streams (Hindi, Tamil, Telugu, etc.)",
    category: "India",
    url: "https://iptv-org.github.io/iptv/countries/in.m3u",
    badge: "🇮🇳 IN",
    channelCountEstimate: "160+",
  },
  {
    id: "iptv-jp",
    name: "Japan (JP Live TV)",
    description: "Japanese digital television networks and web news feeds",
    category: "Japan",
    url: "https://iptv-org.github.io/iptv/countries/jp.m3u",
    badge: "🇯🇵 JP",
    channelCountEstimate: "80+",
  },
  {
    id: "iptv-ua",
    name: "Ukraine (UA Live TV)",
    description: "National news, entertainment, and cultural channels from Ukraine",
    category: "Ukraine",
    url: "https://iptv-org.github.io/iptv/countries/ua.m3u",
    badge: "🇺🇦 UA",
    channelCountEstimate: "100+",
  },
];

/**
 * Robust M3U / M3U8 string parser with automatic IPTV-Org country, category, and metadata resolution
 */
export function parseM3U(content: string, maxLimit = 5000): Channel[] {
  // Extract top-level EPG guide URL if present (url-tvg="..." or x-tvg-url="...")
  const urlTvgMatch = content.match(/(?:url-tvg|x-tvg-url)="([^"]+)"/i);
  const playlistEpgUrl = urlTvgMatch ? urlTvgMatch[1].trim() : undefined;

  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentInfo: (Partial<Channel> & { rawGroupTitle?: string }) | null = null;
  const seenIds = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    if (channels.length >= maxLimit) break;
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      currentInfo = {};

      // Parse name (after the comma at the end of the line)
      const lastCommaIndex = line.lastIndexOf(",");
      if (lastCommaIndex !== -1) {
        currentInfo.name = line.substring(lastCommaIndex + 1).trim();
      }

      // Parse tvg-name as fallback name
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      if (!currentInfo.name && tvgNameMatch && tvgNameMatch[1]) {
        currentInfo.name = tvgNameMatch[1].trim();
      }

      // Parse tvg-id
      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      if (idMatch && idMatch[1]) {
        currentInfo.id = idMatch[1].trim();
      }

      // Parse tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (logoMatch && logoMatch[1]) {
        currentInfo.logo = logoMatch[1].trim();
      }

      // Parse group-title (keep raw group title for country resolution e.g. group-title="United States")
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        currentInfo.rawGroupTitle = groupMatch[1].trim();
        currentInfo.group = normalizeCategory(groupMatch[1].trim());
      }

      // Parse tvg-country
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      if (countryMatch && countryMatch[1]) {
        currentInfo.country = countryMatch[1].trim();
      }

      // Parse tvg-language
      const langMatch = line.match(/tvg-language="([^"]*)"/i);
      if (langMatch && langMatch[1]) {
        currentInfo.language = langMatch[1].trim();
      }
    } else if (line.startsWith("#EXTGRP:") && currentInfo) {
      currentInfo.rawGroupTitle = line.replace("#EXTGRP:", "").trim();
      currentInfo.group = normalizeCategory(currentInfo.rawGroupTitle);
    } else if (line && !line.startsWith("#") && currentInfo) {
      // This is the stream URL line
      const streamUrl = line;

      // Filter out raw web pages or YouTube watch pages that are not direct HLS/MP4 streams
      const isDirectStream =
        streamUrl.startsWith("http://") || streamUrl.startsWith("https://");
      const isYouTubeWeb =
        streamUrl.includes("youtube.com/watch") ||
        streamUrl.includes("youtube.com/@") ||
        streamUrl.includes("youtu.be/");

      if (isDirectStream && !isYouTubeWeb) {
        const channelName = currentInfo.name || "Live Stream";
        const originalTvgId = currentInfo.id;
        let channelId =
          originalTvgId ||
          channelName.toLowerCase().replace(/[^a-z0-9]/g, "-");

        // Ensure unique channelId
        if (seenIds.has(channelId)) {
          channelId = `${channelId}-${Math.random().toString(36).substring(2, 6)}`;
        }
        seenIds.add(channelId);

        // Resolve country with 100% accuracy using iptv-org standards
        const resolved = resolveIptvCountry({
          tvgCountry: currentInfo.country,
          tvgId: originalTvgId,
          groupTitle: currentInfo.rawGroupTitle,
          channelName,
        });

        channels.push({
          id: channelId,
          tvgId: originalTvgId,
          epgUrl: playlistEpgUrl,
          name: channelName,
          logo: currentInfo.logo,
          group: normalizeCategory(currentInfo.group || "Entertainment"),
          category: normalizeCategory(currentInfo.group || "Entertainment"),
          country: resolved.name,
          countryCode: resolved.code,
          countryFlag: resolved.flag,
          language: currentInfo.language || "English",
          url: streamUrl,
        });
      }

      currentInfo = null;
    }
  }

  return channels;
}

const FAVORITES_STORAGE_KEY = "Bu_chill_live_favorites";
const CUSTOM_CHANNELS_STORAGE_KEY = "Bu_chill_custom_channels";

export function getStoredFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStoredFavorite(channelId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const favs = getStoredFavorites();
    const index = favs.indexOf(channelId);
    let isFav = false;
    if (index >= 0) {
      favs.splice(index, 1);
      isFav = false;
    } else {
      favs.push(channelId);
      isFav = true;
    }
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
    return isFav;
  } catch {
    return false;
  }
}

export function getStoredCustomChannels(): Channel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CHANNELS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((ch: Channel) => {
        const cleanGroup = normalizeCategory(ch.group || ch.category);
        return {
          ...ch,
          group: cleanGroup,
          category: cleanGroup,
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredCustomChannels(channels: Channel[]) {
  if (typeof window === "undefined") return;
  try {
    // Keep up to 800 channels in persistent localStorage to prevent browser quota freezes
    const toStore = channels.slice(0, 800);
    localStorage.setItem(CUSTOM_CHANNELS_STORAGE_KEY, JSON.stringify(toStore));
  } catch (err) {
    try {
      localStorage.setItem(
        CUSTOM_CHANNELS_STORAGE_KEY,
        JSON.stringify(channels.slice(0, 200))
      );
    } catch {
      // Ignore quota error safely
    }
  }
}

export function clearStoredCustomChannels() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CUSTOM_CHANNELS_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

