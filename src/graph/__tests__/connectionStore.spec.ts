import { describe, expect, it } from "vitest";
import { ConnectionStore } from "../connectionStore";

describe("ConnectionStore", () => {
	it("adds, updates, queries, removes, and restores connections", () => {
		const store = new ConnectionStore();
		const connection = store.add({
			fromId: "a",
			toId: "b",
			direction: "A_TO_B",
			style: "solid",
		});

		expect(connection.id).toMatch(/^connection-/);
		expect(store.getByFrameId("a")).toHaveLength(1);
		expect(store.update(connection.id, { style: "dashed" })?.style).toBe("dashed");

		const restored = new ConnectionStore();
		restored.fromJSON(store.toJSON());
		expect(restored.getByFrameId("b")[0]?.style).toBe("dashed");

		store.remove(connection.id);
		expect(store.getByFrameId("a")).toEqual([]);
	});
});
