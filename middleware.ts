

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PASSWORD = 'Kingrom@0954u'; // Change this to your desired password

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;


		// Allow access to the password page, the home page, and static files
		if (
			pathname === '/' ||
			pathname.startsWith('/enter-password') ||
			pathname.startsWith('/_next') ||
			pathname.startsWith('/favicon') ||
			pathname.startsWith('/robots.txt') ||
			pathname.startsWith('/public')
		) {
			return NextResponse.next();
		}

	const cookie = request.cookies.get('admin_password');
	if (!cookie || cookie.value !== ADMIN_PASSWORD) {
		const url = request.nextUrl.clone();
		url.pathname = '/enter-password';
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}
