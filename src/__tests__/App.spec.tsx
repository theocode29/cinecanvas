import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

describe("App shell", () => {
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

	it("keeps the draggable title strip as a transparent overlay above the canvas", () => {
		act(() => {
			root.render(<App />);
		});

		const dragRegion = host.querySelector("[data-tauri-drag-region]");

		expect(dragRegion).toBeInstanceOf(HTMLDivElement);
		expect((dragRegion as HTMLDivElement).style.position).toBe("absolute");
		expect((dragRegion as HTMLDivElement).style.height).toBe("32px");
		expect((dragRegion as HTMLDivElement).style.background).toBe("");
		expect(host.querySelector(".react-flow")).not.toBeNull();
	});
});
