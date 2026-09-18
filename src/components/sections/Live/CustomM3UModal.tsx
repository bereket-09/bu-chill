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
import { Channel, parseM3U } from "@/services/iptv";
import { MdCloudUpload, MdLink, MdPlaylistPlay, MdDeleteSweep } from "react-icons/md";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a valid M3U playlist URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Use client fetch (or proxy if CORS)
      const res = await fetch(url.trim());
      if (!res.ok) {
        throw new Error(`Failed to load playlist (HTTP ${res.status})`);
      }
      const text = await res.text();
      const parsed = parseM3U(text);

      if (parsed.length === 0) {
        throw new Error("No valid channels found in this playlist.");
      }

      onAddChannels(parsed);
      setSuccessMsg(`Successfully imported ${parsed.length} channels!`);
      setUrl("");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching playlist";
      setError(
        `${msg}. If this is a CORS issue, please try downloading the .m3u file and uploading it directly below.`
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          setError("No valid channels found in this .m3u file.");
        } else {
          onAddChannels(parsed);
          setSuccessMsg(`Successfully loaded ${parsed.length} channels from ${file.name}!`);
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1200);
        }
      } catch {
        setError("Failed to parse the uploaded file.");
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

  const handleLoadPreset = (presetUrl: string) => {
    setUrl(presetUrl);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      size="xl"
      classNames={{
        base: "border border-white/20 bg-neutral-900/95 backdrop-blur-2xl text-white shadow-2xl",
        header: "border-b border-white/10",
        footer: "border-t border-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-lg font-bold">
          <MdPlaylistPlay className="text-2xl text-primary" />
          <span>Import Custom M3U / IPTV Playlist</span>
        </ModalHeader>

        <ModalBody className="space-y-5 py-4">
          {error && (
            <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              {successMsg}
            </div>
          )}

          {/* Option 1: URL input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <MdLink className="text-base text-primary" />
              <span>Import via M3U URL</span>
            </label>
            <div className="flex gap-2">
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
                onClick={handleFetchUrl}
                isDisabled={isLoading || !url.trim()}
                className="font-bold shrink-0"
              >
                {isLoading ? <Spinner size="sm" color="white" /> : "Load"}
              </Button>
            </div>
          </div>

          {/* Preset Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-white/50">Popular Free Playlists:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset("https://iptv-org.github.io/iptv/languages/eng.m3u")
                }
                className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] text-white/80 transition-colors"
              >
                English Channels (IPTV-org)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset("https://iptv-org.github.io/iptv/categories/news.m3u")
                }
                className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] text-white/80 transition-colors"
              >
                Global News (IPTV-org)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadPreset("https://iptv-org.github.io/iptv/categories/sports.m3u")
                }
                className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] text-white/80 transition-colors"
              >
                Sports Channels
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-neutral-900 px-3 text-[11px] uppercase font-bold text-white/40">
              OR
            </span>
          </div>

          {/* Option 2: File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <MdCloudUpload className="text-base text-primary" />
              <span>Upload Local .m3u / .m3u8 File</span>
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-primary/60 rounded-xl p-4 cursor-pointer bg-white/5 hover:bg-white/10 transition-all text-center">
              <MdCloudUpload className="text-3xl text-white/40 mb-1" />
              <span className="text-xs font-medium text-white/80">
                Click to browse or drop your .m3u playlist here
              </span>
              <span className="text-[10px] text-white/40 mt-0.5">
                Saved privately in your local browser storage
              </span>
              <input
                type="file"
                accept=".m3u,.m3u8,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Current Custom Channels Status */}
          {customChannelCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white/70">
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

        <ModalFooter>
          <Button variant="light" onClick={onClose} className="font-semibold text-white/70">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CustomM3UModal;
