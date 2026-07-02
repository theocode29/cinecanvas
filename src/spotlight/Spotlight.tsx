import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import type { SearchResult } from "@/search/types";
import type { SpotlightState } from "./spotlightReducer";

export type SpotlightStatus = "loading" | "ready" | "empty" | "error";

interface SpotlightProps {
	state: SpotlightState;
	results: SearchResult[];
	status?: SpotlightStatus;
	onQueryChange: (query: string) => void;
	onNavigateLeft: () => void;
	onNavigateRight: () => void;
	onConfirm: () => void;
	onClose: () => void;
}

export const Spotlight = ({
	state,
	results,
	status = "ready",
	onQueryChange,
	onNavigateLeft,
	onNavigateRight,
	onConfirm,
	onClose,
}: SpotlightProps) => {
	if (!state.isOpen) {
		return null;
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "Escape") {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			onNavigateRight();
			return;
		}

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			onNavigateLeft();
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			onConfirm();
		}
	};

	const hasQuery = state.query.trim().length >= 2;
	const message =
		status === "loading"
			? "Index loading"
			: status === "error"
				? "Index unavailable"
				: status === "empty"
					? "No local index"
					: hasQuery && results.length === 0
						? "No match"
						: "";
	const viewportWidth = typeof window === "undefined" ? 760 : window.innerWidth;
	const viewportHeight = typeof window === "undefined" ? 420 : window.innerHeight;
	const panelHalfWidth = Math.min(760, viewportWidth - 32) / 2;
	const panelHalfHeight = 170;
	const minLeft = panelHalfWidth + 16;
	const maxLeft = viewportWidth - panelHalfWidth - 16;
	const minTop = panelHalfHeight;
	const maxTop = viewportHeight - panelHalfHeight;
	const left =
		minLeft > maxLeft
			? viewportWidth / 2
			: Math.min(Math.max(state.position.x, minLeft), maxLeft);
	const top =
		minTop > maxTop
			? viewportHeight / 2
			: Math.min(Math.max(state.position.y, minTop), maxTop);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.97, y: 8 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.97, y: 8 }}
			style={{
				position: "fixed",
				left,
				top,
				transform: "translate(-50%, -50%)",
				width: "min(760px, calc(100vw - 32px))",
				minHeight: 210,
				zIndex: 15,
				pointerEvents: "auto",
				padding: 14,
				border: "1px solid rgba(232, 226, 214, 0.34)",
				borderRadius: 36,
				background: "rgba(47, 62, 51, 0.78)",
				boxShadow:
					"0 30px 80px rgba(17, 25, 20, 0.36), inset 0 1px 0 rgba(255,255,255,0.25)",
			}}
		>
			<input
				autoFocus
				aria-label="Search references"
				value={state.query}
				onChange={(event) => onQueryChange(event.currentTarget.value)}
				onKeyDown={handleKeyDown}
				placeholder="amber corridor"
				style={{
					boxSizing: "border-box",
					width: "100%",
					height: 82,
					border: "1px solid rgba(255, 255, 255, 0.38)",
					borderRadius: 34,
					background: "rgba(239, 240, 236, 0.94)",
					boxShadow: "0 18px 44px rgba(17,25,20,0.18)",
					color: "var(--cc-text-primary)",
					font: "600 28px 'Geist Sans', 'Helvetica Neue', sans-serif",
					outline: "none",
					padding: "0 30px",
				}}
			/>
			{results.length > 0 ? (
				<div
					style={{
						display: "flex",
						gap: 12,
						marginTop: 64,
						overflow: "hidden",
						alignItems: "flex-end",
						padding: "0 24px 4px",
					}}
				>
					{results.map(({ frame }, index) => {
						const selected = index === state.selectedIndex;

						return (
							<img
								key={frame.id}
								src={frame.localThumbPath}
								alt={`${frame.title} - ${frame.director}`}
								width={122}
								height={78}
								style={{
									display: "block",
									width: 122,
									height: 78,
									objectFit: "cover",
									borderRadius: 7,
									boxShadow: selected
										? "0 0 0 3px rgba(239,240,236,0.95), 0 18px 34px rgba(17,25,20,0.38)"
										: "0 10px 26px rgba(17,25,20,0.28)",
									transform: selected ? "translateY(-8px)" : "translateY(0)",
									transition: "transform 140ms ease, box-shadow 140ms ease",
								}}
								draggable={false}
							/>
						);
					})}
				</div>
			) : message ? (
				<div
					aria-live="polite"
					style={{
						margin: "56px 28px 0",
						color: "rgba(239,240,236,0.72)",
						font: "600 13px 'Geist Sans', 'Helvetica Neue', sans-serif",
					}}
				>
					{message}
				</div>
			) : null}
		</motion.div>
	);
};
