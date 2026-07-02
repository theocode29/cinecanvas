import { describe, expect, it } from "vitest";
import { AnnotationStore } from "../annotationStore";

describe("AnnotationStore", () => {
	it("sets, gets, deletes, and serializes annotations", () => {
		const store = new AnnotationStore();
		const annotation = store.set("node-1", "Warm backlight");

		expect(store.get("node-1")).toEqual(annotation);
		expect(annotation.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(store.toJSON()).toHaveLength(1);

		const restored = new AnnotationStore();
		restored.fromJSON(store.toJSON());
		expect(restored.get("node-1")?.text).toBe("Warm backlight");

		store.delete("node-1");
		expect(store.get("node-1")).toBeNull();
	});
});
