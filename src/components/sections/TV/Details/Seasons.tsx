import { forwardRef, memo, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Link,
  Select,
  SelectItem,
  Input,
  ScrollShadow,
  Tabs,
  Tab,
  Tooltip,
} from "@heroui/react";
import { Season } from "tmdb-ts";
import { Grid, List, Search, SortAlpha } from "@/utils/icons";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import dynamic from "next/dynamic";
import IconButton from "@/components/ui/button/IconButton";
import SectionTitle from "@/components/ui/other/SectionTitle";
import { titleCase } from "string-ts";
const TvShowEpisodesSelection = dynamic(() => import("./Episodes"));

interface Props {
  id: number;
  seasons: Season[];
}

const TvShowsSeasonsSelection = forwardRef<HTMLElement, Props>(({ id, seasons }, ref) => {
  const FILTERED_SEASONS = useMemo(() => seasons.filter((s) => s.season_number > 0), [seasons]);
  const [sortedByName, { toggle, close }] = useDisclosure(false);
  const [search, setSearch] = useState("");
  const [searchQuery] = useDebouncedValue(search, 300);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [seasonNumber, setSeasonNumber] = useState(() =>
    FILTERED_SEASONS[0].season_number.toString(),
  );

  return (
    <section ref={ref} id="seasons-episodes" className="my-8 w-full scroll-mt-24">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Episodes
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Browse and stream all available seasons and episodes
          </p>
        </div>
      </div>
      <Card className="bg-[#121318]/90 border border-white/10 rounded-2xl p-2 sm:p-4 shadow-xl backdrop-blur-md">
        <CardHeader className="grid grid-cols-1 grid-rows-[1fr_auto] gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <Select
            aria-label="Seasons"
            selectedKeys={[seasonNumber]}
            disallowEmptySelection={true}
            classNames={{ trigger: "border border-white/15 bg-white/5" }}
            onChange={(e) => {
              close();
              setSearch("");
              setSeasonNumber(e.target.value);
            }}
          >
            {FILTERED_SEASONS.map(({ season_number, name }) => (
              <SelectItem key={season_number.toString()}>{name}</SelectItem>
            ))}
          </Select>
          <Input
            isClearable
            aria-label="Search Episodes"
            placeholder="Search episodes..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search />}
            classNames={{ inputWrapper: "border border-white/15 bg-white/5" }}
          />
          <Tooltip content={titleCase(layout)}>
            <Tabs
              color="warning"
              aria-label="Layout Select"
              size="sm"
              classNames={{ tabList: "border border-white/15 bg-white/5" }}
              onSelectionChange={(value) => setLayout(value as typeof layout)}
              selectedKey={layout}
            >
              <Tab key="list" title={<List />} />
              <Tab key="grid" title={<Grid />} />
            </Tabs>
          </Tooltip>
          <IconButton
            tooltip="Sort by name"
            className="p-2"
            icon={<SortAlpha />}
            onPress={toggle}
            color={sortedByName ? "warning" : undefined}
            variant={sortedByName ? "shadow" : "faded"}
          />
        </CardHeader>
        <CardBody>
          <ScrollShadow className="h-[600px] py-2 pr-2 sm:pr-3">
            <TvShowEpisodesSelection
              id={id}
              seasonNumber={Number(seasonNumber)}
              filters={{ searchQuery, sortedByName, layout }}
            />
          </ScrollShadow>
        </CardBody>
      </Card>
    </section>
  );
});

TvShowsSeasonsSelection.displayName = "TvShowsSeasonsSelection";

export default memo(TvShowsSeasonsSelection);
