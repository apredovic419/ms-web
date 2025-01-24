import type {NextRequest} from 'next/server'

export function middleware(request: NextRequest) {
}

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
