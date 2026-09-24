// React core
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

// Router
import router from "@/router";

// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/css/tailwind.scss";
// Your stylesheet
import "@/css/app.scss";

// Expose app configuration
import appConfig from "../app-config.json";
import { getRuntimePlatform } from "./utils/platform";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig;
}

const runtimePlatform = getRuntimePlatform();
document.documentElement.dataset.platform = runtimePlatform;
document.title = appConfig.app.title || "Saximi shop";

// Mount the app
const root = createRoot(document.getElementById("app")!);
root.render(createElement(RouterProvider, { router }));
