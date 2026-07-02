// Sensory theme + SVG grain — spec §6 + §16 Task 2.2.

export const CINE_THEME = {
	bg: "#F2EDE4",
	surface: "#EDE8DE",
	surfaceRaised: "#E8E2D6",
	border: "rgba(92,72,52,0.12)",
	borderStrong: "rgba(92,72,52,0.22)",
	textPrimary: "#2C2117",
	textSecondary: "#7A6A55",
	textMuted: "#A89880",
	accent: "#C96B3A",
	accentSoft: "rgba(201,107,58,0.12)",
} as const;

export type ThemeKey = keyof typeof CINE_THEME;

export const getCSSVar = (key: ThemeKey): string => `var(--cc-${key})`;

export const injectCSSVars = (): void => {
	for (const [k, v] of Object.entries(CINE_THEME))
		document.documentElement.style.setProperty(`--cc-${k}`, v);
};

const SVG_NS = "http://www.w3.org/2000/svg";

// Build the grain filter via the SVG DOM API instead of innerHTML (avoids XSS
// surface). Produces the same DOM tree as the spec's literal markup.
export const injectGrainFilter = (): void => {
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute(
		"style",
		"position:fixed;width:0;height:0;pointer-events:none;",
	);

	const defs = document.createElementNS(SVG_NS, "defs");
	const filter = document.createElementNS(SVG_NS, "filter");
	filter.setAttribute("id", "cc-grain");
	filter.setAttribute("x", "0%");
	filter.setAttribute("y", "0%");
	filter.setAttribute("width", "100%");
	filter.setAttribute("height", "100%");

	const turb = document.createElementNS(SVG_NS, "feTurbulence");
	turb.setAttribute("type", "fractalNoise");
	turb.setAttribute("baseFrequency", "0.72");
	turb.setAttribute("numOctaves", "4");
	turb.setAttribute("stitchTiles", "stitch");
	turb.setAttribute("result", "noise");

	const sat = document.createElementNS(SVG_NS, "feColorMatrix");
	sat.setAttribute("type", "saturate");
	sat.setAttribute("values", "0");
	sat.setAttribute("in", "noise");
	sat.setAttribute("result", "gray");

	const blend = document.createElementNS(SVG_NS, "feBlend");
	blend.setAttribute("in", "SourceGraphic");
	blend.setAttribute("in2", "gray");
	blend.setAttribute("mode", "overlay");
	blend.setAttribute("result", "blend");

	const comp = document.createElementNS(SVG_NS, "feComposite");
	comp.setAttribute("in", "blend");
	comp.setAttribute("in2", "SourceGraphic");
	comp.setAttribute("operator", "in");

	filter.append(turb, sat, blend, comp);
	defs.append(filter);
	svg.append(defs);
	document.body.prepend(svg);
};
