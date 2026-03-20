import dotenv from "dotenv";
import type { NextConfig } from "next";

// Carregar variáveis de ambiente explicitamente
dotenv.config();

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		turbopackFileSystemCacheForDev: true,
	},
	reactCompiler: true,
	images: {
		remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
	},
	devIndicators: {
		position: "bottom-right",
	},
	// Headers for Safari compatibility
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value: "frame-ancestors 'none';",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
};

export default nextConfig;
