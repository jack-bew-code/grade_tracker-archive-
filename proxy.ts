// Runs before every page. Anyone who isn't signed in gets sent to /sign-in,
// except on the sign-in and sign-up pages themselves.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicPage(request)) await auth.protect();
  },
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
