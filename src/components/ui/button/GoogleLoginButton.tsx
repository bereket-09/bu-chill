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
        // Pre-validate that the Supabase OAuth provider is actually active before navigating away
        try {
          const checkRes = await fetch(data.url, { method: "GET" });
          if (!checkRes.ok) {
            const errBody = await checkRes.json().catch(() => null);
            if (
              errBody?.msg?.toLowerCase().includes("not enabled") ||
              errBody?.error_code === "validation_failed"
            ) {
              setLoading(false);
              addToast({
                title: "Google Sign-In is not enabled in Supabase",
                description:
                  "Google Client ID & Secret must be configured in your Supabase Dashboard under Authentication > Providers > Google.",
                color: "danger",
              });
              return;
            }
          }
        } catch {
          // If fetch fails (e.g. CORS on 302 redirect to accounts.google.com), provider is enabled and redirecting
        }

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
