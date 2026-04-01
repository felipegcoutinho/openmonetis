"use client";

import { useEffect, useRef, useState } from "react";

export function useAttachmentUrl(attachmentId: string) {
	const [url, setUrl] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setUrl(null);
		const el = containerRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0].isIntersecting) return;
				observer.disconnect();
				fetch(`/api/attachments/${attachmentId}/presign`)
					.then((r) => r.json())
					.then((data: { url: string }) => setUrl(data.url))
					.catch(() => {});
			},
			{ rootMargin: "150px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [attachmentId]);

	return { url, containerRef };
}
