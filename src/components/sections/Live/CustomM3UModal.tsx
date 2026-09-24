"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import {
  Channel,
  parseM3U,
  POPULAR_M3U_PLAYLISTS,
  M3UPlaylistPreset,
} from "@/services/iptv";
import {
  MdCloudUpload,
  MdLink,
  MdPlaylistPlay,
  MdDeleteSweep,
  MdCheckCircle,
  MdOutlineFeaturedPlayList,
  MdDownload,
} from "react-icons/md";
import { IoGlobeOutline, IoSearchOutline } from "react-icons/io5";
import { cn } from "@/utils/helpers";
import {
  IPTV_COUNTRIES,
  IptvCountry,
  getIptvCountryPlaylistUrl,
} from "@/constants/iptvCountries";

interface CustomM3UModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannels: (channels: Channel[]) => void;
  onClearCustomChannels: () => void;
  customChannelCount: number;
}

export const CustomM3UModal: React.FC<CustomM3UModalProps> = ({
  isOpen,
  onClose,
  onAddChannels,
  onClearCustomChannels,
  customChannelCount,
}) => {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"presets" | "countries" | "url" | "file">("presets");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * Fetches playlist text using direct fetch first, and falls back to server proxy for CORS.
   */
  const fetchPlaylistText = async (targetUrl: string): Promise<string> => {
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("#EXTINF") || text.includes("#EXTM3U") || text.includes("http")) {
          return text;
        }
      }
    } catch {
      // Direct client fetch failed (likely CORS), use server-side proxy
    }

    const proxyUrl = `/api/live/m3u-proxy?url=${encodeURIComponent(targetUrl)}`;
    const proxyRes = await fetch(proxyUrl);
    if (!proxyRes.ok) {
      const errData = await proxyRes.json().catch(() => ({}));
      throw new Error(errData.error || `Server proxy failed to load playlist (HTTP ${proxyRes.status})`);
    }
    return await proxyRes.text();
  };

  const handleImportUrl = async (targetUrl: string, playlistName?: string) => {
    if (!targetUrl.trim()) {
      setError("Please enter a valid M3U playlist URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const text = await fetchPlaylistText(targetUrl.trim());
      const parsed = parseM3U(text);

      if (parsed.length === 0) {
        throw new Error("No playable video stream channels were found in this playlist.");
      }

      onAddChannels(parsed);
      setSuccessMsg(
        `Successfully loaded ${parsed.length} channels${playlistName ? ` from ${playlistName}` : ""}!`
      );
      setUrl("");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching playlist";
      setError(
        `${msg}. Please verify the link is accessible, or download the .m3u file and upload it directly.`
      );
    } finally {
      setIsLoading(false);
      setLoadingPresetId(null);
    }
  };

  const handlePresetSelect = async (preset: M3UPlaylistPreset) => {
    setLoadingPresetId(preset.id);
    await handleImportUrl(preset.url, preset.name);
  };

  const handleCountrySelect = async (country: IptvCountry) => {
    setSelectedCountryCode(country.code);
    const targetUrl = getIptvCountryPlaylistUrl(country.code);
    await handleImportUrl(targetUrl, `${country.flag} ${country.name} (${country.code})`);
    setSelectedCountryCode(null);
  };

  const filteredCountries = IPTV_COUNTRIES.filter((c) => {
    if (!countrySearch.trim()) return true;
    const q = countrySearch.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseM3U(text);
        if (parsed.length === 0) {
          setError("No valid video stream channels found in this .m3u file.");
        } else {
          onAddChannels(parsed);
          setSuccessMsg(`Successfully loaded ${parsed.length} channels from ${file.name}!`);
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1400);
        }
      } catch {
        setError("Failed to parse the uploaded playlist file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "border border-white/20 bg-neutral-900/95 backdrop-blur-2xl text-white shadow-2xl max-h-[90vh]",
        header: "border-b border-white/10",
        footer: "border-t border-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between gap-2 text-lg font-bold pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <MdPlaylistPlay className="text-2xl" />
            </span>
            <div>
              <span>Working M3U Playlists & IPTV</span>
              <p className="text-[11px] font-normal text-white/50">
                Load 24/7 working linear TV channels or add custom M3U playlists
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4 py-4">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all",
                activeTab === "presets"
                  ? "bg-primary text-white shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <MdOutlineFeaturedPlayList className="text-base" />
              <span>Verified Playlists</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("countries")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all",
                activeTab === "countries"
                  ? "bg-primary text-white shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <IoGlobeOutline className="text-base" />
              <span>By Country (250+)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all",
                activeTab === "url"
                  ? "bg-primary text-white shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <MdLink className="text-base" />
              <span>Enter URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all",
                activeTab === "file"
                  ? "bg-primary text-white shadow"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <MdCloudUpload className="text-base" />
              <span>Upload File</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <MdCheckCircle className="text-base shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Select a verified working playlist to import instantly:</span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  Bypasses CORS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {POPULAR_M3U_PLAYLISTS.map((preset) => {
                  const isThisLoading = isLoading && loadingPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-primary/50 hover:bg-white/10 transition-all",
                        preset.featured && "border-primary/20 bg-primary/5"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                            {preset.name}
                          </h4>
                          {preset.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-300 border border-primary/30 shrink-0">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-white/40 font-medium">
                          {preset.channelCountEstimate} channels
                        </span>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          isDisabled={isLoading}
                          onClick={() => handlePresetSelect(preset)}
                          className="h-7 text-xs font-semibold px-3"
                          startContent={
                            isThisLoading ? (
                              <Spinner size="sm" color="current" />
                            ) : (
                              <MdDownload className="text-sm" />
                            )
                          }
                        >
                          {isThisLoading ? "Loading..." : "Import"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BROWSE BY COUNTRY (IPTV-Org 250+ Countries) */}
          {activeTab === "countries" && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Select any country to import its official IPTV-Org playlist:</span>
                <span className="text-[10px] text-primary font-bold">
                  250+ Countries & Territories
                </span>
              </div>

              {/* Country search filter */}
              <div className="flex items-center bg-black/40 border border-white/15 focus-within:border-primary/50 rounded-xl px-3 py-2 gap-2 shadow-inner">
                <IoSearchOutline className="text-white/40 text-sm shrink-0" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Filter countries (e.g. Canada, US, Japan, Germany, France)..."
                  className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none w-full"
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch("")}
                    className="text-white/40 hover:text-white text-xs font-semibold px-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Countries Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredCountries.map((c) => {
                  const isThisLoading = isLoading && selectedCountryCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleCountrySelect(c)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left group cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="text-lg leading-none shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors truncate">
                            {c.name}
                          </p>
                          <span className="text-[10px] text-white/40 font-mono">
                            {c.code}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isThisLoading ? (
                          <Spinner size="sm" color="primary" />
                        ) : (
                          <span className="text-[10px] text-primary/70 group-hover:text-primary font-bold">
                            Load →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === "url" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                  <MdLink className="text-base text-primary" />
                  <span>Custom M3U / M3U8 Playlist URL</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="https://example.com/playlist.m3u"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-white/20 bg-black/40 hover:border-white/40",
                      input: "text-white text-xs sm:text-sm",
                    }}
                  />
                  <Button
                    color="primary"
                    onClick={() => handleImportUrl(url)}
                    isDisabled={isLoading || !url.trim()}
                    className="font-bold shrink-0 h-10"
                  >
                    {isLoading ? <Spinner size="sm" color="white" /> : "Load Playlist"}
                  </Button>
                </div>
                <p className="text-[11px] text-white/50">
                  Direct HTTP and HTTPS playlists supported. Remote servers without CORS headers are automatically routed through our secure proxy.
                </p>
              </div>

              {/* Quick Preset Badges */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-white/60">
                  Quick-paste popular playlists:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "IPTV-Org Master (All Countries)", url: "https://iptv-org.github.io/iptv/index.country.m3u" },
                    { label: "IPTV-Org Global Index", url: "https://iptv-org.github.io/iptv/index.m3u" },
                    { label: "English Channels (Global)", url: "https://iptv-org.github.io/iptv/languages/eng.m3u" },
                    { label: "🇺🇸 United States (US)", url: "https://iptv-org.github.io/iptv/countries/us.m3u" },
                    { label: "🇬🇧 United Kingdom (UK)", url: "https://iptv-org.github.io/iptv/countries/uk.m3u" },
                    { label: "🇨🇦 Canada (CA)", url: "https://iptv-org.github.io/iptv/countries/ca.m3u" },
                    { label: "🇩🇪 Germany (DE)", url: "https://iptv-org.github.io/iptv/countries/de.m3u" },
                    { label: "🇫🇷 France (FR)", url: "https://iptv-org.github.io/iptv/countries/fr.m3u" },
                    { label: "Live Sports & Action", url: "https://iptv-org.github.io/iptv/categories/sports.m3u" },
                    { label: "Movies & Cinema (24/7)", url: "https://iptv-org.github.io/iptv/categories/movies.m3u" },
                    { label: "Animation & Kids", url: "https://iptv-org.github.io/iptv/categories/animation.m3u" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setUrl(preset.url)}
                      className="rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] text-white/80 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
          {activeTab === "file" && (
            <div className="space-y-3 py-2">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <MdCloudUpload className="text-base text-primary" />
                <span>Upload Local .m3u / .m3u8 File</span>
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-primary/60 rounded-xl p-6 cursor-pointer bg-white/5 hover:bg-white/10 transition-all text-center">
                <MdCloudUpload className="text-4xl text-white/40 mb-2" />
                <span className="text-xs font-semibold text-white/90">
                  Click to browse or drop your .m3u playlist here
                </span>
                <span className="text-[10px] text-white/40 mt-1">
                  Supports standard M3U/M3U8 with #EXTINF directives. Saved safely in browser storage.
                </span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Current Custom Channels Status */}
          {customChannelCount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70 mt-2">
              <span>{customChannelCount} custom channels currently loaded</span>
              <Button
                size="sm"
                color="danger"
                variant="light"
                startContent={<MdDeleteSweep className="text-base" />}
                onClick={onClearCustomChannels}
                className="h-7 text-xs font-semibold"
              >
                Clear Custom
              </Button>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 hidden sm:inline">
            Streams are loaded via HLS HTML5 video player
          </span>
          <Button variant="light" onClick={onClose} className="font-semibold text-white/70">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CustomM3UModal;
