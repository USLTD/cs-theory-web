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
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Automata & Grammar Playground",
				short_name: "Automata",
				description: "Interactive CS Theory tools for DFA, CFG, and more",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				scope: "/",
				icons: [
					{ src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
					{ src: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
					{
						src: "/favicon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
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
