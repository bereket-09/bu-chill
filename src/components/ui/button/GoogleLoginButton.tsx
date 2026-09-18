"use client";

import { Google } from "@/utils/icons";
import { createClient } from "@/utils/supabase/client";
import { addToast, Button } from "@heroui/react";
import { useCallback, useState } from "react";

type GoogleLoginButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "startContent" | "onPress"
>;

const supabase = createClient();

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ variant = "faded", ...props }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setLoading(false);
        const isNotEnabled =
          error.message?.toLowerCase().includes("not enabled") ||
          (error as unknown as { code?: string })?.code === "validation_failed";

        addToast({
          title: isNotEnabled
            ? "Google Login is not enabled in Supabase yet"
            : error.message,
          description: isNotEnabled
            ? "Enable the Google provider in your Supabase Dashboard > Authentication > Providers."
            : undefined,
          color: "danger",
        });
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error("Google login error:", error);
      addToast({
        title: error instanceof Error ? error.message : "An error occurred. Please try again.",
        color: "danger",
      });
    }
  }, []);

  return (
    <Button
      startContent={<Google width={24} />}
      onPress={handleGoogleLogin}
      variant={variant}
      isLoading={loading}
      {...props}
    >
      Continue with Google
    </Button>
  );
};

export default GoogleLoginButton;
