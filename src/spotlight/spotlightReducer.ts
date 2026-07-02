export interface SpotlightPosition {
	x: number;
	y: number;
}

export interface SpotlightState {
	isOpen: boolean;
	position: SpotlightPosition;
	query: string;
	selectedIndex: number;
	resultsCount: number;
}

export type SpotlightAction =
	| { type: "OPEN"; position: SpotlightPosition }
	| { type: "CLOSE" }
	| { type: "SET_QUERY"; query: string }
	| { type: "NAVIGATE_RIGHT" }
	| { type: "NAVIGATE_LEFT" }
	| { type: "SET_RESULTS_COUNT"; count: number };

export const initialSpotlightState: SpotlightState = {
	isOpen: false,
	position: { x: 0, y: 0 },
	query: "",
	selectedIndex: 0,
	resultsCount: 0,
};

export const spotlightReducer = (
	state: SpotlightState,
	action: SpotlightAction,
): SpotlightState => {
	switch (action.type) {
		case "OPEN":
			return {
				...state,
				isOpen: true,
				position: action.position,
				query: "",
				selectedIndex: 0,
				resultsCount: 0,
			};
		case "CLOSE":
			return initialSpotlightState;
		case "SET_QUERY":
			return { ...state, query: action.query, selectedIndex: 0 };
		case "NAVIGATE_RIGHT":
			return {
				...state,
				selectedIndex:
					state.resultsCount === 0
						? 0
						: (state.selectedIndex + 1) % state.resultsCount,
			};
		case "NAVIGATE_LEFT":
			return {
				...state,
				selectedIndex:
					state.resultsCount === 0
						? 0
						: (state.selectedIndex - 1 + state.resultsCount) % state.resultsCount,
			};
		case "SET_RESULTS_COUNT":
			return {
				...state,
				resultsCount: action.count,
				selectedIndex:
					action.count === 0
						? 0
						: Math.min(state.selectedIndex, action.count - 1),
			};
		default:
			return state;
	}
};
