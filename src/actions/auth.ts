"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import {
  ForgotPasswordFormInput,
  ForgotPasswordFormSchema,
  LoginFormInput,
  LoginFormSchema,
  RegisterFormInput,
  RegisterFormSchema,
  ResetPasswordFormInput,
  ResetPasswordFormSchema,
} from "@/schemas/auth";
import { z } from "zod";
import { ActionResponse } from "@/types";

/**
 * A generic type for our authentication actions.
 * @template T The type of the form data.
 * @param data The validated form data.
 * @param supabase The Supabase client instance.
 * @returns An ActionResponse.
 */
type AuthAction<T> = (data: T, supabase: SupabaseClient) => ActionResponse;

/**
 * A higher-order function to create a server action that handles
 * form validation, captcha checks, and Supabase client creation.
 * @template T The type of the form data, which must include an optional captchaToken.
 * @param schema The Zod schema for validation.
 * @param action The core logic of the server action.
 * @returns An async function that serves as the server action.
 */
const createAuthAction = <T extends { captchaToken?: string }>(
  schema: z.ZodSchema<T>,
  action: AuthAction<T>,
  admin?: boolean,
) => {
  return async (formData: T): ActionResponse => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(". ");
      return { success: false, message };
    }

    try {
      const supabase = await createClient(admin);
      return await action(result.data, supabase);
    } catch (error) {
      // Catch potential unhandled errors in actions
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: "An unexpected error occurred." };
    }
  };
};

const signInWithEmailAction: AuthAction<LoginFormInput> = async (data, supabase) => {
  const email = data.email.trim();
  const password = data.loginPassword;

  const { data: user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { success: false, message: "Invalid email or password. Please try again." };
    }
    return { success: false, message: error.message };
  }

  if (!user.user) {
    return { success: false, message: "Could not authenticate user. Please try again." };
  }

  const { data: username } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.user.id)
    .maybeSingle();

  let finalUsername = username?.username;

  if (!finalUsername) {
    const adminSupabase = await createClient(true);
    const fallbackUsername =
      user.user.user_metadata?.username ||
      user.user.user_metadata?.full_name ||
      email.split("@")[0] ||
      "User";

    await adminSupabase.from("profiles").upsert({
      id: user.user.id,
      username: fallbackUsername,
    });
    finalUsername = fallbackUsername;
  }

  return { success: true, message: `Welcome back, ${finalUsername}` };
};

const signUpAction: AuthAction<RegisterFormInput> = async (data) => {
  const adminSupabase = await createClient(true);
  const username = data.username.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;

  // 1. Check username availability in profiles
  const { data: usernameExists, error: usernameError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (usernameError) {
    console.error("Username check error:", usernameError);
    return { success: false, message: "Database error. Could not check username availability." };
  }

  if (usernameExists) {
    return { success: false, message: "Username is already taken. Please choose another." };
  }

  // 2. Create the user using Supabase Admin API with pre-confirmed email
  // (Prevents Supabase default mailer 429 rate limit and allows immediate sign-in)
  const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
    },
  });

  if (createError) {
    if (
      createError.message.toLowerCase().includes("already registered") ||
      createError.message.toLowerCase().includes("already exists")
    ) {
      return {
        success: false,
        message: "An account with this email already exists. Please sign in instead.",
      };
    }
    return { success: false, message: createError.message };
  }

  if (!authData.user) {
    return { success: false, message: "Could not create user account. Please try again." };
  }

  // 3. Upsert user profile record
  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: authData.user.id,
    username,
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    return { success: false, message: "Could not create user profile. Please try again." };
  }

  // 4. Automatically establish user session cookies on the response
  const cookieSupabase = await createClient(false);
  const { error: signInError } = await cookieSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Auto sign-in error:", signInError);
    return {
      success: true,
      message: "Account created successfully! Please sign in with your credentials.",
    };
  }

  return {
    success: true,
    message: `Account created successfully! Welcome to Be Chill, ${username}.`,
  };
};

const sendResetPasswordEmailAction: AuthAction<ForgotPasswordFormInput> = async (
  data,
  supabase,
) => {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim());

  if (error) return { success: false, message: error.message };

  return {
    success: true,
    message: `We have sent an email to ${data.email}. Check spam folder if you don't see it.`,
  };
};

const resetPasswordAction: AuthAction<ResetPasswordFormInput> = async (data, supabase) => {
  const { error } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (error) return { success: false, message: error.message };

  return { success: true, message: "Password has been reset successfully." };
};

export const signIn = createAuthAction(LoginFormSchema, signInWithEmailAction);
export const signUp = createAuthAction(RegisterFormSchema, signUpAction, true);
export const sendResetPasswordEmail = createAuthAction(
  ForgotPasswordFormSchema,
  sendResetPasswordEmailAction,
);
export const resetPassword = createAuthAction(ResetPasswordFormSchema, resetPasswordAction);

export const signOut = async (): ActionResponse => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return { success: false, message: error.message };

  return { success: true, message: "You have been signed out." };
};
