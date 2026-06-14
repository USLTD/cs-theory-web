import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import UnpluginTypia from "@typia/unplugin/vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		UnpluginTypia(),
		react(),
		vike(),
		tailwindcss(),
		VitePWA({ registerType: "autoUpdate" }),
	],
	resolve: {
		alias: {
			"#": resolve(__dirname, "./src"),
			"#components": resolve(__dirname, "./src/components"),
			"#constants": resolve(__dirname, "./src/constants"),
			"#hooks": resolve(__dirname, "./src/hooks"),
			"#lib": resolve(__dirname, "./src/lib"),
			"#styles": resolve(__dirname, "./src/styles"),
			"#types": resolve(__dirname, "./src/types"),
		},
	},
});
