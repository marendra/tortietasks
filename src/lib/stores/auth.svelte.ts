import { auth, db } from '$lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from '$lib/models';

let firebaseUser = $state<FirebaseUser | null>(null);
let userDoc = $state<User | null>(null);
let loading = $state(true);
let docUnsub: (() => void) | null = null;
let authUnsub: (() => void) | null = null;

authUnsub = onAuthStateChanged(auth, (u) => {
	firebaseUser = u;
	if (docUnsub) {
		docUnsub();
		docUnsub = null;
	}
	if (!u) {
		userDoc = null;
		loading = false;
	} else {
		docUnsub = onSnapshot(
			doc(db, 'users', u.uid),
			(snap) => {
				userDoc = snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
				loading = false;
			},
			() => {
				userDoc = null;
				loading = false;
			}
		);
	}
});

export const authStore = {
	get user() {
		return firebaseUser;
	},
	get profile() {
		return userDoc;
	},
	get isAdmin() {
		return userDoc?.role === 'Admin';
	},
	get isEmployee() {
		return userDoc?.role === 'Employee';
	},
	get loading() {
		return loading;
	},
	get isAuthenticated() {
		return !!firebaseUser && !!userDoc;
	}
};
