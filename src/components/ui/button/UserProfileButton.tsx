import { signOut } from "@/actions/auth";
import useBreakpoints from "@/hooks/useBreakpoints";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { DropdownItemProps } from "@/types/component";
import { env } from "@/utils/env";
import { Gear, Logout, User } from "@/utils/icons";
import { useRouter } from "@bprogress/next/app";
import { resolveAvatarUrl } from "@/constants/avatars";
import {
  addToast,
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IoHelpCircleOutline } from "react-icons/io5";

const UserProfileButton: React.FC = () => {
  const router = useRouter();
  const [logout, setLogout] = useState(false);
  const { data: user, isLoading } = useSupabaseUser();
  const { mobile } = useBreakpoints();

  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    const onProfileChange = () => setAvatarVersion((v) => v + 1);
    window.addEventListener("buchill_profile_changed", onProfileChange);
    return () => window.removeEventListener("buchill_profile_changed", onProfileChange);
  }, []);

  const ITEMS: DropdownItemProps[] = useMemo(
    () => [
      {
        label: "My Space",
        href: "/library",
        icon: <User className="text-lg" />,
      },
      {
        label: "Switch Profile",
        href: "/profile",
        icon: <User className="text-lg" />,
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
    [logout, router],
  );

  if (isLoading) return null;

  const guest = !user;
  const storedAvatar = typeof window !== "undefined" && user?.id
    ? localStorage.getItem(`buchill_avatar_${user.id}`)
    : null;
  const avatar = resolveAvatarUrl(storedAvatar || user?.user_metadata?.avatar);

  const ProfileButton = (
    <Button
      title={guest ? "Login" : user.username}
      variant="light"
      href={guest ? "/auth" : undefined}
      as={guest ? Link : undefined}
      isIconOnly={guest || mobile}
      endContent={
        !guest ? (
          <Avatar
            showFallback
            src={avatar}
            className="size-7"
            fallback={<User className="text-xl" />}
          />
        ) : undefined
      }
      className="min-w-fit"
    >
      {guest ? (
        <User className="text-xl" />
      ) : (
        <p className="hidden max-w-32 truncate md:block lg:max-w-56">{user.username}</p>
      )}
    </Button>
  );

  if (guest) return ProfileButton;

  return (
    <Dropdown showArrow closeOnSelect={true} className="min-w-[200px]">
      <DropdownTrigger className="w-10">{ProfileButton}</DropdownTrigger>
      <DropdownMenu
        aria-label="User profile dropdown"
        variant="flat"
        disabledKeys={logout ? ITEMS.map((i) => i.label) : undefined}
      >
        {ITEMS.map(({ label, icon, href, ...props }) => (
          <DropdownItem
            key={label}
            startContent={icon}
            as={href ? Link : undefined}
            href={href}
            {...props}
          >
            {label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default UserProfileButton;
