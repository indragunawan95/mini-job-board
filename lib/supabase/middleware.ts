import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEnvVars } from '../utils';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publicRoutes = [
    '/',
    '/auth/error',
    '/auth/login',
    '/auth/sign-up',
    '/auth/sign-up-success',
    '/auth/update-password',
    '/auth/forgot-password',
    '/auth/callback',
    // This regex matches '/jobs/' followed by an ID, but NOT '/jobs/create'
    // and it must end right after the ID.
    /^\/jobs\/(?!create)[^/]+$/,
  ];

  // Check if the requested path is a public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route instanceof RegExp) {
      return route.test(pathname);
    }
    return pathname === route;
  });

  // If the user is not logged in and is trying to access a protected route...
  if (!user && !isPublicRoute) {
    // ...redirect them to the login page.
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If a logged-in user tries to access a login/signup page...
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return supabaseResponse;
}
