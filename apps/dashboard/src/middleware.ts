import { updateSession } from "@midday/supabase/middleware";
import { createClient } from "@midday/supabase/server";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const nextUrl = request.nextUrl;
  
  // For invoice preview paths (/i/), skip authentication and most middleware processing
  // Check both with and without locale
  if (nextUrl.pathname.includes("/i/") && nextUrl.pathname.split("/i/")[1]?.length > 100) {
    return I18nMiddleware(request);
  }

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];
  
  // Check if the first segment is a locale (e.g., "en")
  const hasLocale = pathnameLocale === "en";

  // Remove the locale from the pathname if it exists
  const pathnameWithoutLocale = hasLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = await createClient();
  const url = new URL("/", request.url);

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    newUrl.search
  }`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Log the session user for debugging
  if (session) {
    console.log(`[Middleware] Session user: ${session.user.id} (${session.user.email}) for path ${newUrl.pathname}`);
  }

  // 1. Not authenticated
  if (
    !session &&
    newUrl.pathname !== "/login" &&
    newUrl.pathname !== "/logout" &&
    newUrl.pathname !== "/forgot-password" &&
    newUrl.pathname !== "/reset-password" &&
    !newUrl.pathname.includes("/auth/callback") &&
    !newUrl.pathname.includes("/i/") &&
    !newUrl.pathname.includes("/s/") &&
    !newUrl.pathname.includes("/verify") &&
    !newUrl.pathname.includes("/all-done") &&
    !newUrl.pathname.includes("/desktop/search")
  ) {
    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // If authenticated, proceed with other checks
  if (session) {
    // Allow authenticated users to access reset-password page
    // (they get a session from the reset password email link)
    if (newUrl.pathname === "/reset-password") {
      return response;
    }

    // Skip redirect checks for login/logout pages if already authenticated
    if (newUrl.pathname === "/login") {
      // If user is already logged in and trying to access login, redirect to appropriate page
      const { data: userData } = await supabase
        .from("users")
        .select("team_id, full_name")
        .eq("id", session.user.id)
        .single();

      // Redirect based on user state
      if (userData && !userData.full_name) {
        const url = new URL("/setup", request.url);
        return NextResponse.redirect(url);
      } else if (userData && !userData.team_id) {
        const url = new URL("/teams", request.url);
        return NextResponse.redirect(url);
      } else {
        const url = new URL("/", request.url);
        return NextResponse.redirect(url);
      }
    }
    
    // 2. Check if user has a team (unless they're on team-related, setup, or logout pages)
    if (
      newUrl.pathname !== "/teams/create" &&
      newUrl.pathname !== "/teams" &&
      newUrl.pathname !== "/setup" &&
      newUrl.pathname !== "/logout" &&
      !newUrl.pathname.startsWith("/teams/invite/")
    ) {
      // Get user data to check team membership
      const { data: userData } = await supabase
        .from("users")
        .select("team_id, full_name")
        .eq("id", session.user.id)
        .single();

      console.log(`[Middleware] Checking user ${session.user.id} for path ${newUrl.pathname}:`, {
        hasFullName: !!userData?.full_name,
        hasTeamId: !!userData?.team_id,
        teamId: userData?.team_id,
      });

      // If user has no full name, redirect to setup
      if (userData && !userData.full_name && newUrl.pathname !== "/setup") {
        console.log(`[Middleware] Redirecting to /setup - no full_name`);
        const url = new URL("/setup", request.url);
        return NextResponse.redirect(url);
      }

      // If user has no team_id, check if they have any team memberships
      if (userData && !userData.team_id) {
        // Check if user has any team memberships
        const { data: memberships } = await supabase
          .from("users_on_team")
          .select("team_id")
          .eq("user_id", session.user.id)
          .limit(1);

        console.log(`[Middleware] User ${session.user.id} has ${memberships?.length || 0} team memberships`);

        // If user has no team_id AND no memberships, redirect to teams page
        if (!memberships || memberships.length === 0) {
          console.log(`[Middleware] Redirecting to /teams - no team_id and no memberships`);
          const url = new URL("/teams", request.url);
          return NextResponse.redirect(url);
        }
        // If user has memberships but no team_id set, redirect to teams page to select one
        else {
          console.log(`[Middleware] Redirecting to /teams - has memberships but no active team_id`);
          const url = new URL("/teams", request.url);
          return NextResponse.redirect(url);
        }
      }
    }

    // Allow invite pages - no redirect needed, just proceed
    if (newUrl.pathname.startsWith("/teams/invite/")) {
      return response;
    }
  }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
