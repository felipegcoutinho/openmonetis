"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PERIOD_PARAM = "periodo";

type NavLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
	href: string;
	preservePeriod?: boolean;
};

export function NavLink({
	href,
	preservePeriod = false,
	...props
}: NavLinkProps) {
	const searchParams = useSearchParams();

	let resolvedHref = href;
	if (preservePeriod) {
		const periodo = searchParams.get(PERIOD_PARAM);
		if (periodo) {
			const separator = href.includes("?") ? "&" : "?";
			resolvedHref = `${href}${separator}${PERIOD_PARAM}=${encodeURIComponent(periodo)}`;
		}
	}

	return <Link href={resolvedHref} {...props} />;
}
