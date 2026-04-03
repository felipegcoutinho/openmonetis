import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth/config";

// Rotas protegidas que requerem autenticação
const PROTECTED_ROUTES = [
	"/settings",
	"/notes",
	"/calendar",
	"/cards",
	"/categories",
	"/accounts",
	"/dashboard",
	"/insights",
	"/transactions",
	"/budgets",
	"/payers",
	"/inbox",
	"/reports",
];

// Rotas públicas (não requerem autenticação)
const PUBLIC_AUTH_ROUTES = ["/login", "/signup"];

export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Multi-domain: block all routes except landing on public domain
	// Normalize PUBLIC_DOMAIN: strip protocol and port if provided
	const publicDomain = process.env.PUBLIC_DOMAIN?.replace(
		/^https?:\/\//,
		"",
	).replace(/:\d+$/, "");
	const hostname = request.headers.get("host")?.replace(/:\d+$/, "");

	if (publicDomain && hostname === publicDomain) {
		if (pathname.startsWith("/api/")) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}
		if (pathname !== "/") {
			return NextResponse.redirect(new URL("/", request.url));
		}
		return NextResponse.next();
	}

	// Validate actual session, not just cookie existence
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	const isAuthenticated = !!session?.user;

	// Redirect authenticated users away from login/signup pages
	if (isAuthenticated && PUBLIC_AUTH_ROUTES.includes(pathname)) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Redirect unauthenticated users trying to access protected routes
	const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
		pathname.startsWith(route),
	);

	if (!isAuthenticated && isProtectedRoute) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	// Apply middleware to protected and auth routes
	matcher: [
		"/",
		"/api/:path*",
		"/settings/:path*",
		"/notes/:path*",
		"/calendar/:path*",
		"/cards/:path*",
		"/categories/:path*",
		"/accounts/:path*",
		"/dashboard/:path*",
		"/insights/:path*",
		"/transactions/:path*",
		"/budgets/:path*",
		"/payers/:path*",
		"/inbox/:path*",
		"/reports/:path*",
		"/login",
		"/signup",
	],
};
