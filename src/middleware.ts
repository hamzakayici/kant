import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/', req.nextUrl))
    }
    return null
  }

  if (!isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return Response.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  // Force change password redirect
  if (isLoggedIn) {
    const isForceChangePage = req.nextUrl.pathname.startsWith('/force-change-password')
    const mustChange = (req.auth?.user as any)?.mustChangePassword

    if (mustChange && !isForceChangePage) {
      return Response.redirect(new URL('/force-change-password', req.nextUrl))
    }

    if (!mustChange && isForceChangePage) {
      return Response.redirect(new URL('/', req.nextUrl))
    }
  }

  return null
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public/share).*)'],
}
