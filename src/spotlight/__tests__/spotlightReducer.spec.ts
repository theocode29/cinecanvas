import { describe, expect, it } from "vitest";
import {
	initialSpotlightState,
	spotlightReducer,
	type SpotlightState,
} from "../spotlightReducer";

const openState: SpotlightState = {
	isOpen: true,
	position: { x: 10, y: 20 },
	query: "red",
	selectedIndex: 0,
	resultsCount: 3,
};

describe("spotlightReducer", () => {
	it("starts closed", () => {
		expect(initialSpotlightState.isOpen).toBe(false);
	});

	it("opens at the requested position", () => {
		const state = spotlightReducer(initialSpotlightState, {
			type: "OPEN",
			position: { x: 120, y: 80 },
		});

		expect(state.isOpen).toBe(true);
		expect(state.position).toEqual({ x: 120, y: 80 });
	});

	it("closes back to the initial state", () => {
		expect(spotlightReducer(openState, { type: "CLOSE" })).toEqual(
			initialSpotlightState,
		);
	});

	it("sets the query", () => {
		const state = spotlightReducer(openState, {
			type: "SET_QUERY",
			query: "blue",
		});

		expect(state.query).toBe("blue");
	});

	it("resets selection when query changes", () => {
		const state = spotlightReducer({ ...openState, selectedIndex: 2 }, {
			type: "SET_QUERY",
			query: "gold",
		});

		expect(state.selectedIndex).toBe(0);
	});

	it("navigates right", () => {
		const state = spotlightReducer(openState, { type: "NAVIGATE_RIGHT" });

		expect(state.selectedIndex).toBe(1);
	});

	it("wraps right navigation", () => {
		const state = spotlightReducer({ ...openState, selectedIndex: 2 }, {
			type: "NAVIGATE_RIGHT",
		});

		expect(state.selectedIndex).toBe(0);
	});

	it("navigates left", () => {
		const state = spotlightReducer({ ...openState, selectedIndex: 2 }, {
			type: "NAVIGATE_LEFT",
		});

		expect(state.selectedIndex).toBe(1);
	});

	it("wraps left navigation", () => {
		const state = spotlightReducer(openState, { type: "NAVIGATE_LEFT" });

		expect(state.selectedIndex).toBe(2);
	});

	it("does not navigate when there are no results", () => {
		const state = spotlightReducer(
			{ ...openState, resultsCount: 0 },
			{ type: "NAVIGATE_RIGHT" },
		);

		expect(state.selectedIndex).toBe(0);
	});

	it("sets the result count", () => {
		const state = spotlightReducer(openState, {
			type: "SET_RESULTS_COUNT",
			count: 5,
		});

		expect(state.resultsCount).toBe(5);
	});

	it("clamps selection when result count shrinks", () => {
		const state = spotlightReducer({ ...openState, selectedIndex: 2 }, {
			type: "SET_RESULTS_COUNT",
			count: 1,
		});

		expect(state.selectedIndex).toBe(0);
	});

	it("open resets query and selected result", () => {
		const state = spotlightReducer(openState, {
			type: "OPEN",
			position: { x: 1, y: 2 },
		});

		expect(state.query).toBe("");
		expect(state.selectedIndex).toBe(0);
		expect(state.resultsCount).toBe(0);
	});
});
