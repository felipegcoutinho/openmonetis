import { useCallback, useRef } from "react";

type Position = { x: number; y: number };

const MIN_VISIBLE_PX = 20;

function clampPosition(
	x: number,
	y: number,
	elementWidth: number,
	elementHeight: number,
): Position {
	// Dialog starts centered (left/top 50% + translate(-50%, -50%)).
	// Clamp offsets so at least MIN_VISIBLE_PX remains visible on each axis.
	const halfViewportWidth = window.innerWidth / 2;
	const halfViewportHeight = window.innerHeight / 2;
	const halfElementWidth = elementWidth / 2;
	const halfElementHeight = elementHeight / 2;

	const minX = MIN_VISIBLE_PX - (halfViewportWidth + halfElementWidth);
	const maxX = halfViewportWidth + halfElementWidth - MIN_VISIBLE_PX;
	const minY = MIN_VISIBLE_PX - (halfViewportHeight + halfElementHeight);
	const maxY = halfViewportHeight + halfElementHeight - MIN_VISIBLE_PX;

	return {
		x: Math.min(Math.max(x, minX), maxX),
		y: Math.min(Math.max(y, minY), maxY),
	};
}

function applyPosition(el: HTMLElement, x: number, y: number) {
	if (x === 0 && y === 0) {
		el.style.translate = "";
		el.style.transform = "";
	} else {
		// Keep the dialog's centered baseline (-50%, -50%) and only add drag offset.
		el.style.translate = `calc(-50% + ${x}px) calc(-50% + ${y}px)`;
		el.style.transform = "";
	}
}

export function useDraggableDialog() {
	const offset = useRef<Position>({ x: 0, y: 0 });
	const dragStart = useRef<Position | null>(null);
	const initialOffset = useRef<Position>({ x: 0, y: 0 });
	const contentRef = useRef<HTMLElement | null>(null);

	const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
		if (e.button !== 0) return;

		dragStart.current = { x: e.clientX, y: e.clientY };
		initialOffset.current = { x: offset.current.x, y: offset.current.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}, []);

	const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
		if (!dragStart.current || !contentRef.current) return;

		const dx = e.clientX - dragStart.current.x;
		const dy = e.clientY - dragStart.current.y;

		const rawX = initialOffset.current.x + dx;
		const rawY = initialOffset.current.y + dy;

		const el = contentRef.current;
		const clamped = clampPosition(rawX, rawY, el.offsetWidth, el.offsetHeight);

		offset.current = clamped;
		applyPosition(el, clamped.x, clamped.y);
	}, []);

	const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
		dragStart.current = null;
		if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		}
	}, []);

	const onPointerCancel = useCallback(() => {
		dragStart.current = null;
	}, []);

	const onLostPointerCapture = useCallback(() => {
		dragStart.current = null;
	}, []);

	const resetPosition = useCallback(() => {
		offset.current = { x: 0, y: 0 };
		if (contentRef.current) {
			applyPosition(contentRef.current, 0, 0);
		}
	}, []);

	const dragHandleProps = {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onLostPointerCapture,
		style: { touchAction: "none" as const, cursor: "grab" },
	};

	const contentRefCallback = useCallback((node: HTMLElement | null) => {
		contentRef.current = node;
	}, []);

	return {
		dragHandleProps,
		contentRefCallback,
		resetPosition,
	};
}
