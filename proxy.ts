import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const path = request.nextUrl.pathname;

  // 1. Exclude public routes
  if (
    path === '/admin/staff-access-portal' ||
    path.startsWith('/verify') ||
    path.startsWith('/admin/verify-employee')
  ) {
    return NextResponse.next();
  }

  // 2. Define Protected Areas
  const isAdminPage = path.startsWith('/admin');
  const isUserPage = path.startsWith('/user');

  // 3. If path is protected AND no token -> Kick out
  if (!token && (isAdminPage || isUserPage)) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/admin/staff-access-portal', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If token exists, check Role AND Status
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const { role, isActive } = payload;

      // Block check: kick out if isActive is explicitly false
      if (isActive === false) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        response.cookies.delete('user');
        return response;
      }

      // Role Checks
      if (isAdminPage) {
        if (role !== 'admin' && role !== 'super_admin' && role !== 'employee') {
          return NextResponse.redirect(new URL('/user/dashboard', request.url));
        }
      }

      if (isUserPage) {
        if (role !== 'user' && role !== 'admin' && role !== 'super_admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

    } catch (e) {
      // If token is corrupt or decoding fails -> Force Logout
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/((?!_next|static|favicon.ico|.*\\..*).*)',
    '/user/((?!_next|static|favicon.ico|.*\\..*).*)',
  ],
};
