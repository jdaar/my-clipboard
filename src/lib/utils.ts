export function uuid(): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c: any) =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	);
}

export function is_array_equal(a: unknown[], b: unknown[]): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	for (let i = 0; i < a.length; ++i) {
		if ((a[i] == null && b[i] != null) || (b[i] == null && a[i] != null)) return false;
		else if (Array.isArray(a[i]) && Array.isArray(b[i])) {
			if (!is_array_equal(a[i] as unknown[], b[i] as unknown[])) return false;
		} else if (typeof a[i] == 'object' && typeof b[i] == 'object' && a[i] != null && b[i] != null) {
			if (!is_array_equal(Object.values(a[i] as object), Object.values(b[i] as object)))
				return false;
		} else if (a[i] !== b[i]) return false;
	}
	return true;
}
