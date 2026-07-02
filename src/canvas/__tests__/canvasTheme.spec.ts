import { describe, it, expect } from "vitest";
import {
	CINE_THEME,
	getCSSVar,
	injectCSSVars,
	injectGrainFilter,
} from "../canvasTheme";

describe("CINE_THEME palette", () => {
	it("bg is the parchment color", () => {
		expect(CINE_THEME.bg).toBe("#F2EDE4");
	});

	it("accent is the burnt copper color", () => {
		expect(CINE_THEME.accent).toBe("#C96B3A");
	});

	it("border is an rgba() string", () => {
		expect(CINE_THEME.border).toMatch(/^rgba\(/);
	});

	it("textPrimary is a #hex string", () => {
		expect(CINE_THEME.textPrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
	});

	it("accentSoft is an rgba() string", () => {
		expect(CINE_THEME.accentSoft).toMatch(/^rgba\(/);
	});

	it("surfaceRaised is defined and non-empty", () => {
		expect(CINE_THEME.surfaceRaised).toBeTruthy();
		expect(CINE_THEME.surfaceRaised.length).toBeGreaterThan(0);
	});

	it("all 10 theme values are non-empty strings", () => {
		const values = Object.values(CINE_THEME);
		expect(values).toHaveLength(10);
		for (const v of values) {
			expect(typeof v).toBe("string");
			expect(v.length).toBeGreaterThan(0);
		}
	});
});

describe("getCSSVar", () => {
	it("formats a theme key into a --cc-* var reference", () => {
		expect(getCSSVar("bg")).toBe("var(--cc-bg)");
		expect(getCSSVar("accent")).toBe("var(--cc-accent)");
	});
});

describe("injection functions", () => {
	it("injectCSSVars sets --cc-bg on documentElement", () => {
		injectCSSVars();
		expect(document.documentElement.style.getPropertyValue("--cc-bg")).toBe(
			"#F2EDE4",
		);
	});

	it("injectGrainFilter does not throw", () => {
		expect(() => injectGrainFilter()).not.toThrow();
	});
});
