import { getCurrentWindow } from "@tauri-apps/api/window";
import { createLogger } from "@/lib/logger";

const log = createLogger("FEAT-008", "WindowControls");
let pinned = false;

export const toggleAlwaysOnTop = async (): Promise<boolean> => {
	const next = !pinned;
	try {
		await getCurrentWindow().setAlwaysOnTop(next);
		pinned = next;
		return pinned;
	} catch (error) {
		log.error("setAlwaysOnTop failed", { error: String(error) });
		return pinned;
	}
};

export const resetAlwaysOnTopStateForTests = (): void => {
	pinned = false;
};
