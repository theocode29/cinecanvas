import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { alignNodes, packNodes, unifySizes } from "../layoutOps";

const makeNode = (id: string, x: number, y: number, width: number, height: number): Node => ({
	id,
	position: { x, y },
	data: {},
	style: { width, height },
});

describe("layoutOps", () => {
	it("aligns nodes to outer edges", () => {
		const nodes = [makeNode("a", 10, 20, 100, 50), makeNode("b", 40, 80, 50, 20)];

		expect(alignNodes(nodes, "left").map((node) => node.position.x)).toEqual([10, 10]);
		expect(alignNodes(nodes, "right").map((node) => node.position.x)).toEqual([10, 60]);
		expect(alignNodes(nodes, "top").map((node) => node.position.y)).toEqual([20, 20]);
		expect(alignNodes(nodes, "bottom").map((node) => node.position.y)).toEqual([50, 80]);
	});

	it("packs selected nodes and preserves original order", () => {
		const nodes = [makeNode("a", 100, 0, 20, 10), makeNode("b", 10, 0, 30, 10)];

		expect(packNodes(nodes).map((node) => [node.id, node.position.x])).toEqual([
			["a", 56],
			["b", 10],
		]);
	});

	it("unifies dimensions while preserving aspect ratio", () => {
		const nodes = [makeNode("a", 0, 0, 100, 50), makeNode("b", 0, 0, 50, 50)];

		expect(unifySizes(nodes, "width")[1]?.style).toMatchObject({ width: 100, height: 100 });
	});
});
