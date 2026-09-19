"use client";

import { useEffect, useState, useTransition } from "react";
import { BsBookmarkCheckFill, BsBookmarkFill } from "react-icons/bs";
import { addToast } from "@heroui/react";
import IconButton from "./IconButton";
import { Trash } from "@/utils/icons";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { SavedMovieDetails } from "@/types/movie";
import {
  checkInWatchlistClient,
  addToWatchlistClient,
  removeFromWatchlistClient,
} from "@/services/libraryClient";
import { queryClient } from "@/app/providers";
import { usePathname } from "next/navigation";

interface BookmarkButtonProps {
  data: SavedMovieDetails;
  isTooltipDisabled?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ data, isTooltipDisabled }) => {
  const pathname = usePathname();
  const { startVibration } = useDeviceVibration();
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!user) {
        setIsChecking(false);
        setIsSaved(false);
        return;
      }

      setIsChecking(true);
      try {
        const isIn = await checkInWatchlistClient(data.id, data.type);
        setIsSaved(isIn);
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkWatchlistStatus();
  }, [user, data.id, data.type]);

  const handleBookmark = () => {
    if (!user) {
      addToast({
        title: "You must be logged in to use this feature",
        color: "warning",
      });
      return;
    }

    startTransition(async () => {
      try {
        if (isSaved) {
          const result = await removeFromWatchlistClient(data.id, data.type);

          if (result.success) {
            setIsSaved(false);

            addToast({
              title: `${data.title} removed from your watchlist!`,
              color: "danger",
              icon: <Trash />,
            });

            if (pathname.startsWith("/library")) {
              queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            }
          } else {
            addToast({
              title: "Error",
              description: result.error || "Failed to remove from watchlist",
              color: "danger",
            });
          }
        } else {
          const result = await addToWatchlistClient(data);

          if (result.success) {
            setIsSaved(true);
            startVibration([100]);
            addToast({
              title: `${data.title} added to your watchlist!`,
              color: "success",
            });
            if (pathname.startsWith("/library")) {
              queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            }
          } else {
            addToast({
              title: "Error",
              description: result.error || "Failed to add to watchlist",
              color: "danger",
            });
          }
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
        addToast({
          title: "Error",
          description: "An unexpected error occurred",
          color: "danger",
        });
      }
    });
  };

  return (
    <IconButton
      onPress={handleBookmark}
      icon={isSaved ? <BsBookmarkCheckFill size={20} /> : <BsBookmarkFill size={20} />}
      variant={isSaved ? "shadow" : "faded"}
      color="warning"
      isLoading={isUserLoading || isChecking || isPending}
      tooltip={
        isTooltipDisabled ? undefined : isSaved ? "Remove from Watchlist" : "Add to Watchlist"
      }
    />
  );
};

export default BookmarkButton;
