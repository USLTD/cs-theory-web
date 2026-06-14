import { objectEntries } from "ts-extras";
import { default as icons_16x16 } from "./icons-16x16";
import { default as icons_32x32 } from "./icons-32x32";

const ICON_SUFFIXES = {
	"16x16": "__16x16",
	"32x32": "__32x32",
} as const;

type WithSuffix<T extends Record<string, unknown>, Suffix extends string> = {
	[K in keyof T as `${K & string}${Suffix}`]: T[K];
};

function addSuffix<
	T extends Record<string, unknown>,
	const Suffix extends string,
>(input: T, suffix: Suffix): WithSuffix<T, Suffix> {
	return Object.fromEntries(
		objectEntries(input).map(([key, value]) => [`${key}${suffix}`, value]),
	) as unknown as WithSuffix<T, Suffix>;
}

export default {
	...addSuffix(icons_16x16, ICON_SUFFIXES["16x16"]),
	...addSuffix(icons_32x32, ICON_SUFFIXES["32x32"]),
};
