import { describe, expect, it } from "vitest";
import { GroupStore } from "../groupStore";

describe("GroupStore", () => {
	it("groups, ungroups, and restores memberships", () => {
		const store = new GroupStore();

		expect(store.group(["a"])).toBeNull();
		const group = store.group(["a", "b", "b"]);
		expect(group?.nodeIds).toEqual(["a", "b"]);
		expect(store.getGroup("b")?.id).toBe(group?.id);

		const restored = new GroupStore();
		restored.fromJSON(store.toJSON());
		expect(restored.getGroup("a")?.nodeIds).toEqual(["a", "b"]);

		store.ungroup(group?.id ?? "");
		expect(store.getGroup("a")).toBeNull();
	});
});
