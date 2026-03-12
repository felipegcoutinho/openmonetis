import type { MetadataRoute } from "next";

const BASE_URL = process.env.PUBLIC_DOMAIN
	? `https://${process.env.PUBLIC_DOMAIN}`
	: "https://openmonetis.com";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: [
					"/dashboard",
					"/transactions",
					"/accounts",
					"/cards",
					"/categories",
					"/budgets",
					"/payers",
					"/notes",
					"/insights",
					"/calendar",
					"/consultor",
					"/settings",
					"/reports",
					"/inbox",
					"/login",
					"/api/",
				],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
