"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ScrollShadow,
  Chip,
} from "@heroui/react";
import { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { FaPlay, FaServer } from "react-icons/fa6";
import { HiSignal } from "react-icons/hi2";
import { MdCastConnected } from "react-icons/md";
import Link from "next/link";

export interface ServerOption {
  name: string;
  subtitle: string;
  index: number;
  type?: "native" | "embed";
  recommended?: boolean;
  fast?: boolean;
  status?: "Connected" | "Online" | "Direct";
}

interface ServerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId?: number | string;
  tvId?: number | string;
  season?: number;
  episode?: number;
  players: PlayersProps[];
  selectedSource?: number;
  onSelectSource?: (index: number) => void;
  title?: string;
}

// Map server index / player title to Bingr-style codenames and subtitles
const getServerMetadata = (player: PlayersProps, index: number): { name: string; subtitle: string } => {
  const codenames = [
    { name: "Singularity", subtitle: "Premium Ad-Free Stream • English Audio" },
    { name: "Bastion", subtitle: "Direct-play HD Stream • English Default" },
    { name: "Nebula", subtitle: "Multi-Server HD • English Audio" },
    { name: "Photon", subtitle: "Direct-play HD Stream • English Audio" },
    { name: "Vortex", subtitle: "Ultra HD Fast CDN • English Audio" },
    { name: "Eclipse", subtitle: "Alternative HD Stream • English" },
    { name: "Titan", subtitle: "Adaptive multi-bitrate • English" },
    { name: "Pulsar", subtitle: "High-speed backup • English" },
    { name: "Chronos", subtitle: "Ultra HD Stream • English" },
    { name: "Zenith", subtitle: "Global CDN Stream • English" },
  ];

  if (player.type === "native") {
    return { name: "Singularity", subtitle: "Premium Ad-Free Stream • English Audio" };
  }

  const meta = codenames[index % codenames.length];
  return {
    name: `${meta.name} — ${player.title}`,
    subtitle: meta.subtitle,
  };
};

export const ServerSelectionModal: React.FC<ServerSelectionModalProps> = ({
  isOpen,
  onClose,
  movieId,
  tvId,
  season = 1,
  episode = 1,
  players,
  selectedSource = 0,
  onSelectSource,
  title = "Select Streaming Server",
}) => {
  const isPlayDirectLink = Boolean(movieId || tvId);

  const getPlayerUrl = (index: number) => {
    if (movieId) {
      return `/movie/${movieId}/player?src=${index}`;
    }
    if (tvId) {
      return `/tv/${tvId}/${season}/${episode}/player?src=${index}`;
    }
    return "#";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: "bg-neutral-950/95 border border-white/10 shadow-2xl rounded-2xl text-white",
        header: "border-b border-white/10 px-6 py-4",
        body: "p-0",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <FaServer className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-neutral-400 font-normal">
                Choose an optimized stream server for the best quality & speed
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <ScrollShadow className="max-h-[60vh] divide-y divide-white/5 px-3 py-2">
            {players.map((player, index) => {
              const { name, subtitle } = getServerMetadata(player, index);
              const isSelected = selectedSource === index;
              const isConnected = isSelected || index === 0;

              const content = (
                <div
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl px-5 py-4 transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-white/10 border border-primary/40 shadow-lg shadow-primary/10 scale-[1.01]"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  {/* Left: Server Name & Subtitle */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xl md:text-2xl font-black tracking-tight transition-colors",
                          isSelected ? "text-white" : "text-neutral-300 group-hover:text-white"
                        )}
                      >
                        {name}
                      </span>
                      {player.type === "native" && (
                        <Chip size="sm" color="success" variant="flat" className="font-semibold text-xs">
                          Ad-Free
                        </Chip>
                      )}
                      {player.recommended && (
                        <Chip size="sm" color="primary" variant="dot" className="text-xs">
                          Recommended
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-neutral-400 font-medium">
                      {subtitle}
                    </span>
                  </div>

                  {/* Right: Status & Action */}
                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                        <MdCastConnected className="text-sm animate-pulse" />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 font-mono">
                        Queue —
                      </span>
                    )}

                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-white/10 text-neutral-400 group-hover:bg-primary group-hover:text-white"
                      )}
                    >
                      <FaPlay className="text-xs ml-0.5" />
                    </div>
                  </div>
                </div>
              );

              if (isPlayDirectLink) {
                return (
                  <Link
                    key={index}
                    href={getPlayerUrl(index)}
                    onClick={() => {
                      onSelectSource?.(index);
                      onClose();
                    }}
                    className="block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  onClick={() => {
                    onSelectSource?.(index);
                    onClose();
                  }}
                >
                  {content}
                </div>
              );
            })}
          </ScrollShadow>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ServerSelectionModal;
