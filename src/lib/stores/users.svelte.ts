import { allUsersStream } from '$lib/services/firebase_service';
import type { User } from '$lib/models';

let users = $state<User[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

allUsersStream(
	(data) => {
		users = data;
		loading = false;
		error = null;
	},
	(err) => {
		console.error('[Firestore] Error in "users" collection:', err.message);
		loading = false;
		error = err.message;
	}
);

export function createUsersStore() {
	return {
		get users() {
			return users;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get usersMap() {
			const map = new Map<string, User>();
			for (const u of users) map.set(u.id, u);
			return map;
		}
	};
}
