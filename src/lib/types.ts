import type { Edge, Node } from '@xyflow/svelte';
import type { Writable } from 'svelte/store';

export type Canvas = {
	nodes: Node[];
	edges: Edge[];
};

export type WritableCanvas = {
	nodes: Writable<Node[]>;
	edges: Writable<Edge[]>;
};

export type SyncPlan = {
	origin: 'data' | 'position';
	nodes: {
		upsert: string[];
		delete: string[];
	};
	edges: {
		upsert: string[];
		delete: string[];
	};
};

export type SyncPlanCanvas = {
	nodes: { [x: string]: Node };
	edges: { [x: string]: Edge };
};

export type Optional<T> = T | null;

export type OptionalObject<T> = {
	[P in keyof T]?: T[P];
};

type _HandledTextLink = {
	link: string;
	image: string;
	description: string;
	title: string;
};
export type HandledTextLink = OptionalObject<_HandledTextLink>;
type _HandledTextCode = {
	code: string;
    highlighted_code: string;
	language: string;
};
export type HandledTextCode = OptionalObject<_HandledTextCode>;
type _HandledTextPlain = {
	text: string;
};
export type HandledTextPlain = OptionalObject<_HandledTextPlain>;

export type HandledText =
	| {
			component: 'code-text';
			data: HandledTextCode;
	  }
	| {
			component: 'link-text';
			data: HandledTextLink;
	  }
	| {
			component: 'plain-text';
			data: HandledTextPlain;
	  };
