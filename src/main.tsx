import React from "react";
import ReactDOM from "react-dom/client";
import { injectCSSVars, injectGrainFilter } from "@/canvas/canvasTheme";
import App from "./App";

injectCSSVars();
injectGrainFilter();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
