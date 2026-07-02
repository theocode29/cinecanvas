import { Handle, NodeResizer, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CanvasImageData } from "@/search/types";

const MAX_W = 400;

// React Flow v12 requires node data to satisfy Record<string, unknown>.
// The intersection adds the index signature without changing the domain shape
// (keeps src/search/types.ts — the public data model — pure).
type ImageNodeData = CanvasImageData & Record<string, unknown>;
export type ImageNodeType = Node<ImageNodeData, "image">;

export const ImageNode = ({ data, selected }: NodeProps<ImageNodeType>) => {
	const { source, rotation, grayscale } = data;
	const scale = source.width > MAX_W ? MAX_W / source.width : 1;
	const w = Math.round(source.width * scale);
	const h = Math.round(source.height * scale);
	const src =
		"localThumbPath" in source ? source.localThumbPath : source.localPath;
	const alt =
		"title" in source
			? `${source.title} — ${source.director}`
			: "Imported reference";
	const annotation = typeof data.annotation === "string" ? data.annotation : "";

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				minWidth: 64,
				minHeight: 40,
				transform: `rotate(${rotation}deg)`,
				filter: grayscale ? "grayscale(1)" : "none",
				boxShadow: selected
					? "0 0 0 2px var(--cc-accent), 0 0 0 5px var(--cc-accent-soft)"
					: "0 2px 8px rgba(44,33,23,0.18)",
				borderRadius: 4,
				cursor: "grab",
				position: "relative",
			}}
		>
			<NodeResizer
				isVisible={selected}
				minWidth={48}
				minHeight={32}
				lineStyle={{ borderColor: "var(--cc-accent)" }}
				handleStyle={{ background: "var(--cc-accent)", borderColor: "var(--cc-bg)" }}
			/>
			<Handle type="target" position={Position.Left} style={{ opacity: selected ? 1 : 0 }} />
			<Handle type="source" position={Position.Right} style={{ opacity: selected ? 1 : 0 }} />
			<img
				src={src}
				alt={alt}
				width={w}
				height={h}
				style={{
					display: "block",
					width: "100%",
					height: "100%",
					objectFit: "cover",
					borderRadius: 4,
				}}
				draggable={false}
			/>
			{annotation ? (
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						bottom: -30,
						minHeight: 22,
						padding: "4px 7px",
						borderRadius: 4,
						background: "rgba(242, 237, 228, 0.94)",
						color: "var(--cc-text-primary)",
						font: "500 11px 'Geist Sans', 'Helvetica Neue', sans-serif",
						boxShadow: "0 3px 12px rgba(44,33,23,0.16)",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{annotation}
				</div>
			) : null}
		</div>
	);
};
