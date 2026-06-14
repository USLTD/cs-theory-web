export type ToastMessageType = "info" | "success" | "error" | "warning";

export type ToastMessage = {
	id: number;
	title: string;
	message: string;
	type: ToastMessageType;
};
