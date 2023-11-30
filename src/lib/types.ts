import type { Edge, Node } from "@xyflow/svelte";
import type { UserCredential, OAuthCredential } from "firebase/auth";
import type { Writable } from "svelte/store";

export type Canvas = {
    nodes: Node[];
    edges: Edge[];
}

export type WritableCanvas = {
    nodes: Writable<Node[]>;
    edges: Writable<Edge[]>;
}

export type SerializedCanvas = { nodes: { [x: string]: string }, edges: string };

export type AuthenticatedUser = { credential: UserCredential, oauth_credential: OAuthCredential}

export type OptionalObject<T> = {
    [P in keyof T]?: T[P];
}

type _HandledTextLink = {
    link: string,
    image: string,
    description: string,
    title: string
}
export type HandledTextLink = OptionalObject<_HandledTextLink>
type _HandledTextCode = {
    code: string,
    language: string,
}
export type HandledTextCode = OptionalObject<_HandledTextCode>
type _HandledTextPlain = {
    text: string
}
export type HandledTextPlain = OptionalObject<_HandledTextPlain>

export type HandledText = {
    component: 'code-text',
    data: HandledTextCode
} |
{
    component: 'link-text',
    data: HandledTextLink
} |
{
    component: 'plain-text',
    data: HandledTextPlain
}
