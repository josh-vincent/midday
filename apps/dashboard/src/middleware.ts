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
  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = await createClient();
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    newUrl.search
  }`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Not authenticated
  if (
    !session &&
    newUrl.pathname !== "/login" &&
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
    // 2. Check if user has a team (unless they're on team-related or setup pages)
    if (
      newUrl.pathname !== "/teams/create" &&
      newUrl.pathname !== "/teams" &&
      newUrl.pathname !== "/setup" &&
      !newUrl.pathname.startsWith("/teams/invite/")
    ) {
      // Get user data to check team membership
      const { data: userData } = await supabase
        .from("users")
        .select("team_id, full_name")
        .eq("id", session.user.id)
        .single();

      // If user has no full name, redirect to setup
      if (userData && !userData.full_name) {
        const url = new URL("/setup", request.url);
        return NextResponse.redirect(url);
      }

      // If user has no team, redirect to team creation
      if (userData && !userData.team_id) {
        const url = new URL("/teams", request.url);
        return NextResponse.redirect(url);
      }
    }

    // Allow invite pages
    if (newUrl.pathname.startsWith("/teams/invite/")) {
      return NextResponse.redirect(`${url.origin}${request.nextUrl.pathname}`);
    }
  }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
