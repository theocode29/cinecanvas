import type { Node } from "@xyflow/react";

export type Edge2D = "left" | "right" | "top" | "bottom";

const readSize = (node: Node, dimension: "width" | "height"): number =>
	Number(node.style?.[dimension] ?? 0);

const readEdge = (node: Node, edge: Edge2D): number => {
	if (edge === "left") return node.position.x;
	if (edge === "top") return node.position.y;
	if (edge === "right") return node.position.x + readSize(node, "width");
	return node.position.y + readSize(node, "height");
};

export const alignNodes = <T extends Node>(nodes: readonly T[], edge: Edge2D): T[] => {
	if (nodes.length < 2) return [...nodes];
	const values = nodes.map((node) => readEdge(node, edge));
	const target = edge === "left" || edge === "top" ? Math.min(...values) : Math.max(...values);

	return nodes.map((node) => {
		if (edge === "left") return { ...node, position: { ...node.position, x: target } };
		if (edge === "top") return { ...node, position: { ...node.position, y: target } };
		if (edge === "right") {
			return { ...node, position: { ...node.position, x: target - readSize(node, "width") } };
		}
		return { ...node, position: { ...node.position, y: target - readSize(node, "height") } };
	}) as T[];
};

export const packNodes = <T extends Node>(nodes: readonly T[], gap = 16): T[] => {
	if (nodes.length < 2) return [...nodes];
	const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
	let cursor = sorted[0]?.position.x ?? 0;
	const packed = new Map<string, T>();

	for (const node of sorted) {
		packed.set(node.id, { ...node, position: { ...node.position, x: cursor } } as T);
		cursor += readSize(node, "width") + gap;
	}

	return nodes.map((node) => packed.get(node.id) ?? node);
};

export const unifySizes = <T extends Node>(
	nodes: readonly T[],
	dimension: "width" | "height",
): T[] => {
	if (nodes.length < 2) return [...nodes];
	const reference = nodes[0];
	if (!reference) return [...nodes];
	const target = readSize(reference, dimension);
	if (target <= 0) return [...nodes];

	return nodes.map((node) => {
		const width = readSize(node, "width");
		const height = readSize(node, "height");
		if (width <= 0 || height <= 0) return node;
		const ratio = dimension === "width" ? target / width : target / height;
		return {
			...node,
			style: {
				...node.style,
				width: Math.round(width * ratio),
				height: Math.round(height * ratio),
			},
		} as T;
	});
};
