"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface AnimateOnScrollProps {
	children: ReactNode;
	className?: string;
}

export function AnimateOnScroll({ children, className }: AnimateOnScrollProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(element);
				}
			},
			{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={`transition-all duration-700 ease-out ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
			} ${className ?? ""}`}
		>
			{children}
		</div>
	);
}
