import { Inter } from "next/font/google";

export const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
	fallback: ["ui-sans-serif", "system-ui"],
	weight: ["500", "600", "700"],
	preload: true,
});
