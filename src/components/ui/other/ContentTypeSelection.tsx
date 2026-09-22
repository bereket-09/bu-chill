"use client";

import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { ContentType } from "@/types";
import { Movie, TV } from "@/utils/icons";

interface ContentTypeSelectionProps {
  className?: string;
  onTypeChange?: (type: ContentType) => void;
}

const ContentTypeSelection: React.FC<ContentTypeSelectionProps> = ({
  className = "",
  onTypeChange,
}) => {
  const { content, setContent, resetFilters } = useDiscoverFilters();

  const handleTabChange = (key: ContentType) => {
    if (content === key) return;
    resetFilters();
    setContent(key);
    onTypeChange?.(key);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="inline-flex items-center p-1 rounded-full bg-neutral-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <button
          type="button"
          onClick={() => handleTabChange("movie")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            content === "movie"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Movie className="text-base" />
          <span>Movies</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("tv")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            content === "tv"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TV className="text-base" />
          <span>TV Shows</span>
        </button>
      </div>
    </div>
  );
};

export default ContentTypeSelection;
