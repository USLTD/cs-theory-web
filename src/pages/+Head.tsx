// src/pages/+Head.tsx
export default function Head() {
	return (
		<>
			{/* Favicon */}
			<link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
			<link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
			<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

			{/* Apple Touch Icon (iOS home screen) */}
			<link rel="apple-touch-icon" href="/favicon-180x180.png" />

			{/* PWA Manifest */}
			<link rel="manifest" href="/manifest.webmanifest" />

			{/* Theme color (matches your icon bg) */}
			<meta name="theme-color" content="#2B5F9E" />
		</>
	);
}
