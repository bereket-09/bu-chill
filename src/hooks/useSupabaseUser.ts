"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { queryClient } from "@/app/providers";
import { addToast } from "@heroui/react";

type AuthUserData = User & {
  username: string;
  avatar?: string;
};

const fetchUser = async (): Promise<AuthUserData | null> => {
  let AuthUser: AuthUserData | null = null;

  const supabase = createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error.message);

    addToast({
      title: "Error fetching user",
      description: error.message,
      color: "danger",
    });

    return null;
  }

  if (user) {
    let profileAvatar: string | undefined;
    let profileUsername: string | undefined;

    try {
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("username, avatar")
        .eq("id", user.id)
        .maybeSingle();

      profileUsername = profile?.username;
      profileAvatar = profile?.avatar;
    } catch {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        profileUsername = profile?.username;
      } catch (_) {}
    }

    const cachedAvatar =
      typeof window !== "undefined"
        ? localStorage.getItem(`buchill_avatar_${user.id}`) ||
          localStorage.getItem("buchill_avatar") ||
          undefined
        : undefined;

    const resolvedAvatar =
      profileAvatar ||
      user.user_metadata?.avatar ||
      user.user_metadata?.avatar_id ||
      cachedAvatar ||
      "01";

    if (resolvedAvatar && typeof window !== "undefined") {
      try {
        localStorage.setItem(`buchill_avatar_${user.id}`, resolvedAvatar);
        localStorage.setItem("buchill_avatar", resolvedAvatar);
      } catch (_) {}
    }

    AuthUser = {
      ...user,
      avatar: resolvedAvatar,
      username:
        profileUsername ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "User",
    };
  }

  return AuthUser;
};

const useSupabaseUser = () => {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["supabase-user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return query;
};

export default useSupabaseUser;
