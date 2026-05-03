import { clientsStream } from '$lib/services/firebase_service';
import type { Client } from '$lib/models';

let clients = $state<Client[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

clientsStream(
	(data) => {
		clients = data;
		loading = false;
		error = null;
	},
	(err) => {
		console.error('[Firestore] Error in "clients" collection:', err.message);
		loading = false;
		error = err.message;
	}
);

export function createClientsStore() {
	return {
		get clients() {
			return clients;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get clientsMap() {
			const map = new Map<string, Client>();
			for (const c of clients) map.set(c.id, c);
			return map;
		}
	};
}
