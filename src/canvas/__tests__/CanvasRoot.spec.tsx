import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilmFrame, SearchResult } from "@/search/types";
import { CanvasRoot } from "../CanvasRoot";

class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

const frame: FilmFrame = {
	id: "frame-1",
	title: "Red Hallway",
	director: "Jane Doe",
	year: 1977,
	localThumbPath: "/thumbs/frame-1.jpg",
	sourceUrl: "https://film-grab.test/red-hallway",
	filmGrabWpId: 1,
	dominantColors: ["#FF0000", "#220000", "#110000"],
	embedding: [1, 0],
	width: 224,
	height: 126,
};

const waitFor = async (assertion: () => void): Promise<void> => {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		try {
			assertion();
			return;
		} catch (error) {
			if (attempt === 9) {
				throw error;
			}
			await act(async () => {
				await Promise.resolve();
			});
		}
	}
};

describe("CanvasRoot", () => {
	let host: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
		vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		});

		host = document.createElement("div");
		host.style.width = "1024px";
		host.style.height = "768px";
		document.body.append(host);
		root = createRoot(host);
	});

	afterEach(() => {
		act(() => root.unmount());
		host.remove();
		vi.unstubAllGlobals();
	});

	it("mounts a React Flow canvas with the CineCanvas visual layer", () => {
		act(() => {
			root.render(<CanvasRoot />);
		});

		expect(host.querySelector(".react-flow")).not.toBeNull();
		expect(host.querySelector(".cinecanvas-flow")).not.toBeNull();
		expect(host.querySelectorAll(".react-flow__background")).toHaveLength(2);
		expect(host.querySelector('[style*="url(#cc-grain)"]')).toBeNull();
	});

	it("opens the spotlight with Cmd+F", () => {
		act(() => {
			root.render(<CanvasRoot loadFrames={async () => []} />);
		});

		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "f",
					metaKey: true,
					bubbles: true,
				}),
			);
		});

		expect(host.querySelector('input[aria-label="Search references"]')).not.toBeNull();
	});

	it("drops the selected spotlight result onto the canvas", async () => {
		const search = vi.fn<() => Promise<SearchResult[]>>().mockResolvedValue([
			{ frame, score: 1 },
		]);

		act(() => {
			root.render(<CanvasRoot searchClient={{ search }} />);
		});

		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "f",
					metaKey: true,
					bubbles: true,
				}),
			);
		});

		const input = host.querySelector(
			'input[aria-label="Search references"]',
		) as HTMLInputElement;
		const valueSetter = Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set;

		act(() => {
			valueSetter?.call(input, "red");
			input.dispatchEvent(new Event("input", { bubbles: true }));
		});

		await waitFor(() => expect(search).toHaveBeenCalledWith({ text: "red", limit: 6 }));
		await waitFor(() => {
			expect(host.querySelector('img[alt="Red Hallway - Jane Doe"]')).not.toBeNull();
		});

		act(() => {
			input.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
			);
		});

		await waitFor(() => {
			expect(host.querySelector('img[alt="Red Hallway — Jane Doe"]')).not.toBeNull();
		});
	});
});
