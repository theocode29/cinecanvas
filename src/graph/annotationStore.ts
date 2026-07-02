export interface Annotation {
	nodeId: string;
	text: string;
	updatedAt: string;
}

export class AnnotationStore {
	private annotations = new Map<string, Annotation>();

	get(nodeId: string): Annotation | null {
		return this.annotations.get(nodeId) ?? null;
	}

	set(nodeId: string, text: string): Annotation {
		const annotation = {
			nodeId,
			text,
			updatedAt: new Date().toISOString(),
		};
		this.annotations.set(nodeId, annotation);
		return annotation;
	}

	delete(nodeId: string): void {
		this.annotations.delete(nodeId);
	}

	toJSON(): Annotation[] {
		return Array.from(this.annotations.values());
	}

	fromJSON(annotations: readonly Annotation[]): void {
		this.annotations.clear();
		for (const annotation of annotations) {
			this.annotations.set(annotation.nodeId, { ...annotation });
		}
	}
}
