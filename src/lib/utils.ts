import { z } from "zod";
import type { HandledTextLink } from "./types";
import { is_user_logged_in_guard } from "./guards/auth-guard";

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

const metadata_model = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	image: z.string().optional(),
	url: z.string()
});

export async function retrieve_url_metadata(url: string): Promise<HandledTextLink> {
	const is_user_logged_in = is_user_logged_in_guard();
	if (is_user_logged_in.status == 'error') {
		throw new Error(is_user_logged_in.message ?? 'retrieve_url_metadata');
	}
	const parsed_metadata = await metadata_model.safeParseAsync(await (await fetch('https://extract-metadata-v2-wsxayh4eyq-uc.a.run.app', {
		method: 'POST',
		body: JSON.stringify({ target_url: url }),
		headers: {
			'Content-Type': 'application/json'
		}
	})).json());
	if (!parsed_metadata.success) {
		throw new Error(parsed_metadata.error.message);
	}
	return parsed_metadata.data;
}
