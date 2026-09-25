import { PlayersProps } from "@/types";

/**
 * Safely appends resume timestamp if startAt is provided
 */
const appendStartAt = (url: string, startAt?: number): string => {
  if (!startAt || startAt <= 0) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}startAt=${Math.floor(startAt)}`;
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
      title: "CineSrc (English - Recommended)",
      source: appendStartAt(`https://cinesrc.st/embed/movie/${id}`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "VidLink (English HD)",
      source: `https://vidlink.pro/movie/${id}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false${startAt && startAt > 0 ? `&startAt=${Math.floor(startAt)}` : ""}`,
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Videasy (Fast English HD)",
      source: appendStartAt(`https://player.videasy.to/movie/${id}?color=f5a524`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Cinezo (English HD)",
      source: appendStartAt(`https://player.cinezo.live/embed/movie/${id}`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidy (Fast Stream)",
      source: appendStartAt(`https://www.vidy.st/movie/${id}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidbolt (English)",
      source: appendStartAt(`https://vidbolt.xyz/movie/${id}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Bingr Stream (Fast Backup)",
      source: `https://bingr.one/watch/movie/${id}`,
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "AutoEmbed (English)",
      source: appendStartAt(`https://autoembed.co/movie/tmdb/${id}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "VidSrc SBS (Multi-Server)",
      source: appendStartAt(`https://vidsrc.sbs/embed/movie/${id}/`, startAt),
      type: "embed",
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "AnyEmbed (English)",
      source: appendStartAt(`https://anyembed.xyz/embed/tmdb-movie-${id}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "Filmu (Regional / Secondary)",
      source: appendStartAt(`https://embed.filmu.in/movie/${id}`, startAt),
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
      title: "CineSrc (English - Recommended)",
      source: appendStartAt(
        `https://cinesrc.st/embed/tv/${id}?s=${season}&e=${episode}&color=f5a524&autoplay=false&autonext=true`,
        startAt
      ),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "VidLink (English HD)",
      source: `https://vidlink.pro/tv/${id}/${season}/${episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false${startAt && startAt > 0 ? `&startAt=${Math.floor(startAt)}` : ""}`,
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Videasy (Fast English HD)",
      source: appendStartAt(
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
      source: appendStartAt(`https://player.cinezo.live/embed/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidy (Fast Stream)",
      source: appendStartAt(`https://www.vidy.st/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Vidbolt (English)",
      source: appendStartAt(`https://vidbolt.xyz/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "Bingr Stream (Fast Backup)",
      source: `https://bingr.one/watch/tv/${id}/${season}/${episode}`,
      type: "embed",
      fast: true,
      ads: false,
      resumable: true,
    },
    {
      title: "AutoEmbed (English)",
      source: appendStartAt(`https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`, startAt),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "VidSrc SBS (Multi-Server)",
      source: appendStartAt(`https://vidsrc.sbs/embed/tv/${id}/${season}/${episode}`, startAt),
      type: "embed",
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "AnyEmbed (English)",
      source: appendStartAt(
        `https://anyembed.xyz/embed/tmdb-tv-${id}/${season}/${episode}`,
        startAt
      ),
      type: "embed",
      ads: true,
      resumable: true,
    },
    {
      title: "Filmu (Regional / Secondary)",
      source: appendStartAt(`https://embed.filmu.in/tv/${id}/${season}/${episode}`, startAt),
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

