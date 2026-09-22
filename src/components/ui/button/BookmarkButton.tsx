"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  addToast,
} from "@heroui/react";
import { FaPlus, FaCheck, FaClock, FaTrash, FaPlay } from "react-icons/fa6";
import { BsBookmarkFill } from "react-icons/bs";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { SavedMovieDetails } from "@/types/movie";
import {
  getWatchlistStatusClient,
  addToWatchlistClient,
  removeFromWatchlistClient,
} from "@/services/libraryClient";
import { WatchlistStatus } from "@/services/profileStorage";
import { queryClient } from "@/app/providers";
import { usePathname } from "next/navigation";

interface BookmarkButtonProps {
  data: SavedMovieDetails;
  isTooltipDisabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  data,
  className = "",
  size = "md",
}) => {
  const pathname = usePathname();
  const { startVibration } = useDeviceVibration();
  const { data: user } = useSupabaseUser();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<WatchlistStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        setIsChecking(true);
        const status = await getWatchlistStatusClient(data.id, data.type);
        if (isMounted) setCurrentStatus(status);
      } catch (err) {
        console.error("Error checking watchlist status:", err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    checkStatus();

    const handleUpdate = () => checkStatus();
    window.addEventListener("buchill_profile_changed", handleUpdate);
    window.addEventListener("buchill_watchlist_changed", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("buchill_profile_changed", handleUpdate);
      window.removeEventListener("buchill_watchlist_changed", handleUpdate);
    };
  }, [user, data.id, data.type]);

  const handleSelectStatus = (newStatus: WatchlistStatus) => {
    startTransition(async () => {
      try {
        // If clicking the current status, toggle remove
        if (currentStatus === newStatus) {
          const res = await removeFromWatchlistClient(data.id, data.type);
          if (res.success) {
            setCurrentStatus(null);
            addToast({
              title: `${data.title} removed from ${newStatus}!`,
              color: "danger",
              icon: <FaTrash />,
            });
            if (pathname.startsWith("/library")) {
              queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            }
          }
          return;
        }

        // Otherwise set to newStatus
        const res = await addToWatchlistClient(data, newStatus);
        if (res.success) {
          setCurrentStatus(newStatus);
          startVibration([100]);
          const label =
            newStatus === "completed"
              ? "Completed"
              : newStatus === "planned"
              ? "Planned"
              : "Watchlist";
          addToast({
            title: `${data.title} saved to ${label}!`,
            color: "success",
            icon: <FaCheck />,
          });
          if (pathname.startsWith("/library")) {
            queryClient.invalidateQueries({ queryKey: ["watchlist"] });
          }
        }
      } catch (e) {
        console.error("Error updating watchlist status:", e);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeFromWatchlistClient(data.id, data.type);
      if (res.success) {
        setCurrentStatus(null);
        addToast({
          title: `${data.title} removed from your lists!`,
          color: "danger",
          icon: <FaTrash />,
        });
        if (pathname.startsWith("/library")) {
          queryClient.invalidateQueries({ queryKey: ["watchlist"] });
        }
      }
    });
  };

  const getTriggerIcon = () => {
    if (currentStatus === "completed") {
      return <FaCheck className="text-emerald-400 text-sm" />;
    }
    if (currentStatus === "planned") {
      return <FaClock className="text-amber-400 text-sm" />;
    }
    if (currentStatus === "watchlist") {
      return <BsBookmarkFill className="text-primary text-sm" />;
    }
    return <FaPlus className="text-white text-sm" />;
  };

  return (
    <Dropdown placement="bottom-start" backdrop="opaque">
      <DropdownTrigger>
        <Button
          isIconOnly
          size={size === "sm" ? "sm" : "md"}
          radius="full"
          variant={currentStatus ? "solid" : "bordered"}
          isLoading={isChecking || isPending}
          className={`shrink-0 transition-all duration-200 border-white/20 hover:scale-105 ${
            currentStatus === "completed"
              ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-300"
              : currentStatus === "planned"
              ? "bg-amber-600/30 border-amber-500/50 text-amber-300"
              : currentStatus === "watchlist"
              ? "bg-primary/25 border-primary/50 text-primary"
              : "bg-white/10 hover:bg-white/20 text-white"
          } ${className}`}
          aria-label="Add to list"
        >
          {getTriggerIcon()}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Watchlist status options"
        variant="flat"
        className="min-w-[180px] p-2 bg-neutral-900/95 border border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl"
      >
        <DropdownItem
          key="watchlist"
          onPress={() => handleSelectStatus("watchlist")}
          startContent={<FaPlay className="text-xs text-primary mr-1" />}
          endContent={
            currentStatus === "watchlist" ? <FaCheck className="text-xs text-primary" /> : null
          }
          className={`rounded-xl py-2.5 ${
            currentStatus === "watchlist" ? "bg-primary/15 text-primary font-semibold" : "text-white/90"
          }`}
        >
          Watchlist
        </DropdownItem>
        <DropdownItem
          key="planned"
          onPress={() => handleSelectStatus("planned")}
          startContent={<FaClock className="text-xs text-amber-400 mr-1" />}
          endContent={
            currentStatus === "planned" ? <FaCheck className="text-xs text-amber-400" /> : null
          }
          className={`rounded-xl py-2.5 ${
            currentStatus === "planned" ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-white/90"
          }`}
        >
          Planned
        </DropdownItem>
        <DropdownItem
          key="completed"
          onPress={() => handleSelectStatus("completed")}
          startContent={<FaCheck className="text-xs text-emerald-400 mr-1" />}
          endContent={
            currentStatus === "completed" ? <FaCheck className="text-xs text-emerald-400" /> : null
          }
          className={`rounded-xl py-2.5 ${
            currentStatus === "completed" ? "bg-emerald-500/15 text-emerald-400 font-semibold" : "text-white/90"
          }`}
        >
          Completed
        </DropdownItem>
        {currentStatus ? (
          <DropdownItem
            key="remove"
            color="danger"
            onPress={handleRemove}
            startContent={<FaTrash className="text-xs text-red-400 mr-1" />}
            className="rounded-xl py-2 text-red-400 hover:bg-red-500/10 mt-1 border-t border-white/10"
          >
            Remove
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
};

export default BookmarkButton;
