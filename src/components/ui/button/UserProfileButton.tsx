import { signOut } from "@/actions/auth";
import useBreakpoints from "@/hooks/useBreakpoints";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { DropdownItemProps } from "@/types/component";
import { Gear, Logout, User } from "@/utils/icons";
import { useRouter } from "@bprogress/next/app";
import { resolveAvatarUrl } from "@/constants/avatars";
import {
  getActiveProfile,
  getUserProfiles,
  switchActiveProfile,
  UserProfileItem,
} from "@/services/profileStorage";
import { cn } from "@/utils/helpers";
import {
  addToast,
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IoHelpCircleOutline } from "react-icons/io5";
import { LuUsers } from "react-icons/lu";
import { SiBuymeacoffee } from "react-icons/si";
import { siteConfig } from "@/config/site";

const UserProfileButton: React.FC = () => {
  const router = useRouter();
  const [logout, setLogout] = useState(false);
  const { data: user, isLoading } = useSupabaseUser();
  const { mobile } = useBreakpoints();

  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    const onProfileChange = () => setProfileVersion((v) => v + 1);
    window.addEventListener("buchill_profile_changed", onProfileChange);
    window.addEventListener("buchill_profiles_updated", onProfileChange);
    return () => {
      window.removeEventListener("buchill_profile_changed", onProfileChange);
      window.removeEventListener("buchill_profiles_updated", onProfileChange);
    };
  }, []);

  const profiles = useMemo<UserProfileItem[]>(() => {
    if (typeof window === "undefined" || !user?.id) return [];
    return getUserProfiles(user.id, user.username);
  }, [user, profileVersion]);

  const activeProfile = useMemo<UserProfileItem>(() => {
    if (typeof window === "undefined" || !user?.id) {
      return { id: "main", name: user?.username || "User", avatar: "01", isMain: true };
    }
    return getActiveProfile(user.id, user.username);
  }, [user, profileVersion]);

  const handleSwitch = (p: UserProfileItem) => {
    if (!user || p.id === activeProfile.id) return;
    switchActiveProfile(user.id, p.id);
    addToast({
      title: `Switched to ${p.name}`,
      description: "Watch history and preferences updated",
      color: "primary",
    });
  };

  const ITEMS: DropdownItemProps[] = useMemo(
    () => [
      {
        label: "My Space",
        href: "/library",
        icon: <User className="text-lg" />,
      },
      {
        label: "Manage Profiles",
        href: "/profile",
        icon: <LuUsers className="text-lg" />,
      },
      {
        label: "Account Settings",
        href: "/settings",
        icon: <Gear className="text-lg" />,
      },
      {
        label: "Help & Support",
        href: "/support",
        icon: <IoHelpCircleOutline className="text-lg" />,
      },
      {
        label: "Buy Me a Coffee",
        href: siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem",
        target: "_blank",
        rel: "noopener noreferrer",
        icon: <SiBuymeacoffee className="text-lg text-[#FFDD00]" />,
      },
      {
        label: "Logout",
        onClick: async () => {
          if (logout) return;
          setLogout(true);
          const { success, message } = await signOut();
          addToast({
            title: message,
            color: success ? "primary" : "danger",
          });
          if (!success) {
            return setLogout(false);
          }
          return router.push("/auth");
        },
        icon: logout ? <Spinner size="sm" color="danger" /> : <Logout className="text-lg" />,
        color: "danger",
        className: "text-danger",
      },
    ],
    [logout, router]
  );

  if (isLoading) return null;

  const guest = !user;
  const avatarUrl = resolveAvatarUrl(activeProfile.avatar);

  const ProfileButton = (
    <Button
      title={guest ? "Login" : `Streaming as ${activeProfile.name}`}
      variant="light"
      href={guest ? "/auth" : undefined}
      as={guest ? Link : undefined}
      isIconOnly={guest || mobile}
      endContent={
        !guest ? (
          <Avatar
            showFallback
            src={avatarUrl}
            className="size-7 ring-1 ring-white/20"
            fallback={<User className="text-xl" />}
          />
        ) : undefined
      }
      className="min-w-fit"
    >
      {guest ? (
        <User className="text-xl" />
      ) : (
        <p className="hidden max-w-32 truncate md:block lg:max-w-56 font-semibold">
          {activeProfile.name}
        </p>
      )}
    </Button>
  );

  if (guest) return ProfileButton;

  return (
    <Dropdown showArrow closeOnSelect={true} className="min-w-[240px]">
      <DropdownTrigger className="w-10">{ProfileButton}</DropdownTrigger>
      <DropdownMenu
        aria-label="User profile dropdown"
        variant="flat"
        disabledKeys={logout ? ITEMS.map((i) => i.label) : undefined}
      >
        {/* Header with active profile indicator */}
        <DropdownSection showDivider aria-label="Current Streaming Profile">
          <DropdownItem
            key="header_profile"
            textValue="Active Profile"
            className="h-14 gap-2 opacity-100 cursor-default"
            isReadOnly
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={avatarUrl}
                className="size-9 ring-2 ring-primary shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-white/50 leading-none">Streaming as</span>
                <span className="text-sm font-bold text-white leading-tight truncate">
                  {activeProfile.name}
                </span>
                <span className="text-[10px] text-white/40 truncate">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownItem>
        </DropdownSection>

        {/* Profiles switcher section (up to 5 profiles) */}
        {profiles.length > 0 ? (
          <DropdownSection title={`Switch Profile (${profiles.length}/5)`} showDivider aria-label="Profiles list">
            {profiles.map((p) => {
              const isCurrent = p.id === activeProfile.id;
              return (
                <DropdownItem
                  key={`profile_${p.id}`}
                  textValue={p.name}
                  onClick={() => handleSwitch(p)}
                  startContent={
                    <Avatar
                      src={resolveAvatarUrl(p.avatar)}
                      className={cn(
                        "size-6 ring-1",
                        isCurrent ? "ring-primary" : "ring-white/15 opacity-80"
                      )}
                    />
                  }
                  endContent={
                    isCurrent ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    ) : undefined
                  }
                  className={cn(
                    "cursor-pointer transition-colors",
                    isCurrent ? "bg-white/10 text-white font-bold" : "text-white/80 hover:text-white"
                  )}
                >
                  <span className="truncate text-xs">{p.name}</span>
                </DropdownItem>
              );
            })}
          </DropdownSection>
        ) : null}

        {/* Standard Menu Items */}
        <DropdownSection aria-label="Navigation options">
          {ITEMS.map(({ label, icon, href, target, rel, ...props }) => {
            const isExternal = href?.startsWith("http");
            return (
              <DropdownItem
                key={label}
                startContent={icon}
                as={href ? (isExternal ? "a" : Link) : undefined}
                href={href}
                target={target || (isExternal ? "_blank" : undefined)}
                rel={rel || (isExternal ? "noopener noreferrer" : undefined)}
                {...props}
              >
                {label}
              </DropdownItem>
            );
          })}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};

export default UserProfileButton;
