"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

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

	const resolvedHref = useMemo(() => {
		if (!preservePeriod) return href;
		const periodo = searchParams.get(PERIOD_PARAM);
		if (!periodo) return href;
		const separator = href.includes("?") ? "&" : "?";
		return `${href}${separator}${PERIOD_PARAM}=${encodeURIComponent(periodo)}`;
	}, [href, preservePeriod, searchParams]);

	return <Link href={resolvedHref} {...props} />;
}
