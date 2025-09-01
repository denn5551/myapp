import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Проверяем, является ли путь админским
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const email = request.cookies.get('email')?.value

    // Если email не соответствует админскому, редиректим на главную
    if (email !== 'kcc-kem@ya.ru') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
} 
