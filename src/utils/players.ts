import { PlayersProps } from "@/types";

/**
 * Helper to ensure embed URLs default to English audio and subtitles
 */
const withEnglishDefaults = (url: string, startAt?: number): string => {
  const separator = url.includes("?") ? "&" : "?";
  let fullUrl = `${url}${separator}sub=en&lang=en&audio=en&ds_lang=en&default_lang=en&subtitle=en&default_audio=en`;
  if (startAt && startAt > 0) {
    const s = Math.floor(startAt);
    fullUrl += `&startAt=${s}&time=${s}&t=${s}&start=${s}`;
  }
  return fullUrl;
};

/**
 * Generates a list of movie players with their respective titles and source URLs.
 * Prepend any native/direct ad-free sources if provided.
 *
 * @param {string | number} id - The ID of the movie to be embedded in the player URLs.
 * @param {number} [startAt] - The start position in seconds to be embedded in the player URLs. Optional.
 * @param {PlayersProps[]} [customSources] - Additional or direct stream sources (e.g. OMSS / CinePro).
 * @returns {PlayersProps[]} - An array of objects, each containing player config.
 */
export const getMoviePlayers = (
  id: string | number,
  startAt?: number,
  customSources?: PlayersProps[]
): PlayersProps[] => {
  const fallbackEmbeds: PlayersProps[] = [
    {
      title: "VidLink (English HD - Recommended)",
      source: withEnglishDefaults(
        `https://vidlink.pro/movie/${id}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
        startAt
      ),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Bingr Stream (Ultra Fast / No Ads)",
      source: `https://bingr.one/watch/movie/${id}`,
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Videasy (Fast English HD)",
      source: withEnglishDefaults(`https://player.videasy.to/movie/${id}?color=f5a524`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Cinezo (English HD)",
      source: withEnglishDefaults(`https://player.cinezo.live/embed/movie/${id}`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidy (Fast Stream)",
      source: withEnglishDefaults(`https://www.vidy.st/movie/${id}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "CineSrc (English)",
      source: withEnglishDefaults(`https://cinesrc.st/embed/movie/${id}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidbolt (English)",
      source: withEnglishDefaults(`https://vidbolt.xyz/movie/${id}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "AutoEmbed (English)",
      source: withEnglishDefaults(`https://autoembed.co/movie/tmdb/${id}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "VidSrc SBS (Multi-Server)",
      source: withEnglishDefaults(`https://vidsrc.sbs/embed/movie/${id}/`, startAt),
      type: "embed",
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "AnyEmbed (English)",
      source: withEnglishDefaults(`https://anyembed.xyz/embed/tmdb-movie-${id}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "Filmu (Regional / Secondary)",
      source: withEnglishDefaults(`https://embed.filmu.in/movie/${id}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
  ];

  if (customSources && customSources.length > 0) {
    return [...customSources, ...fallbackEmbeds];
  }

  return fallbackEmbeds;
};

/**
 * Generates a list of TV show players with their respective titles and source URLs.
 *
 * @param {string | number} id - The ID of the TV show to be embedded in the player URLs.
 * @param {number} season - The season number.
 * @param {number} episode - The episode number.
 * @param {number} [startAt] - The start position in seconds. Optional.
 * @param {PlayersProps[]} [customSources] - Additional or direct stream sources (e.g. OMSS / CinePro).
 * @returns {PlayersProps[]} - An array of objects, each containing player config.
 */
export const getTvShowPlayers = (
  id: string | number,
  season: number,
  episode: number,
  startAt?: number,
  customSources?: PlayersProps[]
): PlayersProps[] => {
  const fallbackEmbeds: PlayersProps[] = [
    {
      title: "VidLink (English HD - Recommended)",
      source: withEnglishDefaults(
        `https://vidlink.pro/tv/${id}/${season}/${episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false`,
        startAt
      ),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Bingr Stream (Ultra Fast / No Ads)",
      source: `https://bingr.one/watch/tv/${id}/${season}/${episode}`,
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Videasy (Fast English HD)",
      source: withEnglishDefaults(
        `https://player.videasy.to/tv/${id}/${season}/${episode}?color=f5a524`,
        startAt
      ),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Cinezo (English HD)",
      source: withEnglishDefaults(`https://player.cinezo.live/embed/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidy (Fast Stream)",
      source: withEnglishDefaults(`https://www.vidy.st/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "CineSrc (English)",
      source: withEnglishDefaults(
        `https://cinesrc.st/embed/tv/${id}?s=${season}&e=${episode}&color=f5a524&autoplay=true&autonext=true`,
        startAt
      ),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidbolt (English)",
      source: withEnglishDefaults(`https://vidbolt.xyz/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "AutoEmbed (English)",
      source: withEnglishDefaults(`https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "VidSrc SBS (Multi-Server)",
      source: withEnglishDefaults(`https://vidsrc.sbs/embed/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "AnyEmbed (English)",
      source: withEnglishDefaults(
        `https://anyembed.xyz/embed/tmdb-tv-${id}/${season}/${episode}`,
        startAt
      ),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "Filmu (Regional / Secondary)",
      source: withEnglishDefaults(`https://embed.filmu.in/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
  ];

  if (customSources && customSources.length > 0) {
    return [...customSources, ...fallbackEmbeds];
  }

  return fallbackEmbeds;
};

