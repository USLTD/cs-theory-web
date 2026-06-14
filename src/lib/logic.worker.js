import { transformLogicFormula } from "./logicTransforms";

self.onmessage = (e) => {
	const data = e.data;
	if (data.type !== "TRANSFORM_LOGIC") return;

	const { formula, id } = data;

	try {
		const result = transformLogicFormula(formula);
		self.postMessage({ id, result });
	} catch (err) {
		self.postMessage({
			id,
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
