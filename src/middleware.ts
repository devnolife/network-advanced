import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

// Routes that require authentication
const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/dashboard/admin'];
const instructorRoutes = ['/dashboard/instructor'];
const studentRoutes = ['/dashboard/student'];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isInstructorRoute = instructorRoutes.some(route => pathname.startsWith(route));
  const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));

  // If no token and trying to access protected route
  if (!token && isProtectedRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If token exists, verify it
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userRole = payload.role as string;

      // If logged in and trying to access auth routes, redirect to dashboard
      if (isAuthRoute) {
        if (userRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        } else if (userRole === 'INSTRUCTOR') {
          return NextResponse.redirect(new URL('/dashboard/instructor', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard/student', request.url));
        }
      }

      // Check role-based access
      if (isAdminRoute && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }

      if (isInstructorRoute && !['ADMIN', 'INSTRUCTOR'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }

    } catch {
      // Invalid token, clear it and redirect to login
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
