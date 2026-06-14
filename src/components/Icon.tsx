import { forwardRef, type ImgHTMLAttributes } from "react";
import icons from "#constants/icons";
import { cn } from "#lib/cn";

type IconKey = keyof typeof icons;
type IconBaseName = IconKey extends `${infer Name}__${string}` ? Name : never;
type IconPostfix = "16x16" | "32x32" | false;

interface IconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
	name: IconBaseName | IconKey;
	postfix?: IconPostfix;
}

function resolveIconKey(
	name: IconProps["name"],
	postfix: IconPostfix,
): IconKey {
	if (postfix === false) {
		return name as IconKey;
	}

	const suffixed = `${name}__${postfix}` as IconKey;
	return suffixed in icons ? suffixed : (name as IconKey);
}

export const Icon = forwardRef<HTMLImageElement, IconProps>(function Icon(
	{ name, postfix = "16x16", className, alt, ...props },
	ref,
) {
	const key = resolveIconKey(name, postfix);

	const size = postfix === "16x16" ? 16 : postfix === "32x32" ? 32 : undefined;

	return (
		<img
			ref={ref}
			src={icons[key]}
			alt={alt ?? String(name)}
			className={cn(
				"inline-block h-4 w-4 shrink-0 [image-rendering:pixelated]",
				className,
			)}
			width={size}
			height={size}
			decoding="async"
			{...props}
		/>
	);
});

Icon.displayName = "Icon";
