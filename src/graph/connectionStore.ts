import type { Connection } from "@/search/types";

export class ConnectionStore {
	private connections = new Map<string, Connection>();

	add(connection: Omit<Connection, "id"> & { id?: string }): Connection {
		const next = {
			...connection,
			id: connection.id ?? `connection-${crypto.randomUUID()}`,
		};
		this.connections.set(next.id, next);
		return next;
	}

	update(id: string, patch: Partial<Omit<Connection, "id">>): Connection | null {
		const current = this.connections.get(id);
		if (!current) return null;
		const next = { ...current, ...patch };
		this.connections.set(id, next);
		return next;
	}

	remove(id: string): void {
		this.connections.delete(id);
	}

	getByFrameId(nodeId: string): Connection[] {
		return Array.from(this.connections.values()).filter(
			(connection) => connection.fromId === nodeId || connection.toId === nodeId,
		);
	}

	toJSON(): Connection[] {
		return Array.from(this.connections.values());
	}

	fromJSON(connections: readonly Connection[]): void {
		this.connections.clear();
		for (const connection of connections) {
			this.connections.set(connection.id, { ...connection });
		}
	}
}
