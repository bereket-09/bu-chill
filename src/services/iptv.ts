export interface Channel {
  id: string;
  name: string;
  logo?: string;
  group: string;
  category?: string;
  url: string;
  country?: string;
  language?: string;
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

// High-reliability curated public HLS streams
export const CURATED_CHANNELS: Channel[] = [
  // --- NEWS ---
  {
    id: "bbc-news",
    name: "BBC News",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/bbc.co.uk/bbc.co.uk.png",
    group: "News",
    country: "UK",
    language: "English",
    url: "https://vs-hls-push-uk-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.m3u8",
  },
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
    id: "abc-news-live",
    name: "ABC News Live",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/abc.go.com/abc.go.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8",
  },
  {
    id: "cbs-news",
    name: "CBS News 24/7",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/cbs.com/cbs.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f13459e98054f5816d2c31b/master.m3u8",
  },
  {
    id: "bloomberg-tv",
    name: "Bloomberg TV",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/bloomberg.com/bloomberg.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://bloomberg.com/media-manifest/streams/us.m3u8",
  },
  {
    id: "euronews-en",
    name: "Euronews English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/euronews.com/euronews.com.png",
    group: "News",
    country: "Europe",
    language: "English",
    url: "https://rakuten-euronews-1-gb.samsung.wurl.tv/playlist.m3u8",
  },
  {
    id: "al-jazeera-en",
    name: "Al Jazeera English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/aljazeera.com/aljazeera.com.png",
    group: "News",
    country: "Qatar",
    language: "English",
    url: "https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
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
    id: "france-24-en",
    name: "France 24 English",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/france24.com/france24.com.png",
    group: "News",
    country: "France",
    language: "English",
    url: "https://f24hls-i.akamaihd.net/hls/live/221193/F24_EN_LO_HLS/master_2000.m3u8",
  },
  {
    id: "scripps-news",
    name: "Scripps News",
    logo: "https://raw.githubusercontent.com/iptv-org/epg/master/sites/scrippsnews.com/scrippsnews.com.png",
    group: "News",
    country: "US",
    language: "English",
    url: "https://scrippsnews-scripps-1-us.roku.wurl.tv/playlist.m3u8",
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

/**
 * Robust M3U / M3U8 string parser
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentInfo: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      currentInfo = {};

      // Parse name (after the comma at the end of the line)
      const lastCommaIndex = line.lastIndexOf(",");
      if (lastCommaIndex !== -1) {
        currentInfo.name = line.substring(lastCommaIndex + 1).trim();
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

      // Parse group-title
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        currentInfo.group = groupMatch[1].trim();
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
    } else if (line && !line.startsWith("#") && currentInfo) {
      // This is the stream URL line
      const streamUrl = line;
      const channelName = currentInfo.name || "Live Stream";
      const channelId =
        currentInfo.id ||
        channelName.toLowerCase().replace(/[^a-z0-9]/g, "-") +
        "-" +
        Math.random().toString(36).substring(2, 7);

      channels.push({
        id: channelId,
        name: channelName,
        logo: currentInfo.logo,
        group: currentInfo.group || "Other",
        country: currentInfo.country || "Global",
        language: currentInfo.language || "English",
        url: streamUrl,
      });

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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomChannels(channels: Channel[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_CHANNELS_STORAGE_KEY, JSON.stringify(channels));
  } catch {
    // Ignore localStorage quota errors
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
