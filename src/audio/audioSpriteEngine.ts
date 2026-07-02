import { createLogger } from "@/lib/logger";

export type AudioEvent = "search-open" | "drop" | "duplicate" | "export";

const log = createLogger("EAR-CANDY", "AudioSpriteEngine");

export class AudioSpriteEngine {
	private audio: HTMLAudioElement | null = null;
	private loaded = false;

	async load(url: string): Promise<void> {
		try {
			const audio = new Audio(url);
			audio.preload = "auto";
			this.audio = audio;
			this.loaded = true;
		} catch (error) {
			this.loaded = false;
			log.warn("Audio sprite failed to load", { error: String(error) });
		}
	}

	play(_event: AudioEvent): void {
		if (!this.loaded || !this.audio) return;
		this.audio.currentTime = 0;
		void this.audio.play().catch((error) => {
			log.warn("Audio sprite playback failed", { error: String(error) });
		});
	}
}
