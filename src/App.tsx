import { CanvasRoot } from "@/canvas/CanvasRoot";

export default function App() {
	return (
		<div
			style={{
				position: "relative",
				width: "100vw",
				height: "100vh",
				background: "var(--cc-bg)",
				overflow: "hidden",
			}}
		>
			{/* Tauri v2 overlay windows need an explicit drag region (tauri#9503); native traffic lights overlay the top-left. */}
			<div
				data-tauri-drag-region
				aria-hidden="true"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 32,
					zIndex: 20,
					userSelect: "none",
				}}
			/>
			<CanvasRoot />
		</div>
	);
}
