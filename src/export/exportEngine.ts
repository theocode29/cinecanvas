import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toPng } from "html-to-image";
import { createLogger } from "@/lib/logger";

const log = createLogger("FEAT-008", "ExportEngine");

const decodeDataUrl = (dataUrl: string): Uint8Array => {
	const payload = dataUrl.split(",")[1] ?? "";
	return Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
};

export const exportViewportToPng = async (viewportEl: HTMLElement): Promise<boolean> => {
	try {
		const dataUrl = await toPng(viewportEl, { backgroundColor: "#F2EDE4" });
		const path = await save({
			defaultPath: "cinecanvas.png",
			filters: [{ name: "PNG", extensions: ["png"] }],
		});
		if (!path) return false;
		await writeFile(path, decodeDataUrl(dataUrl));
		return true;
	} catch (error) {
		log.error("Export failed", { error: String(error) });
		return false;
	}
};
