import type { Group } from "@/search/types";

export class GroupStore {
	private groups = new Map<string, Group>();

	group(nodeIds: readonly string[]): Group | null {
		const uniqueNodeIds = Array.from(new Set(nodeIds));
		if (uniqueNodeIds.length < 2) return null;
		const group = { id: `group-${crypto.randomUUID()}`, nodeIds: uniqueNodeIds };
		this.groups.set(group.id, group);
		return group;
	}

	ungroup(groupId: string): void {
		this.groups.delete(groupId);
	}

	getGroup(nodeId: string): Group | null {
		for (const group of this.groups.values()) {
			if (group.nodeIds.includes(nodeId)) return group;
		}
		return null;
	}

	toJSON(): Group[] {
		return Array.from(this.groups.values());
	}

	fromJSON(groups: readonly Group[]): void {
		this.groups.clear();
		for (const group of groups) {
			this.groups.set(group.id, { id: group.id, nodeIds: [...group.nodeIds] });
		}
	}
}
