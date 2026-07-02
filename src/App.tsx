import { CanvasRoot } from "@/canvas/CanvasRoot";

export default function App() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100vw",
				height: "100vh",
				background: "var(--cc-bg)",
			}}
		>
			{/* Tauri v2 overlay windows need an explicit drag region (tauri#9503); native traffic lights overlay the top-left. */}
			<div
				data-tauri-drag-region
				style={{ height: 32, flexShrink: 0, userSelect: "none" }}
			/>
			<div style={{ flex: 1, minHeight: 0 }}>
				<CanvasRoot />
			</div>
		</div>
	);
}
