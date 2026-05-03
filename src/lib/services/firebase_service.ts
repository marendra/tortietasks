import { auth, db, functions } from '$lib/firebase';
import {
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	type User as FirebaseUser
} from 'firebase/auth';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	onSnapshot,
	serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type {
	User,
	Client,
	Task,
	TaskMessage,
	TaskFile,
	TaskStatus,
	TaskPriority,
	UploadResult
} from '$lib/models';

// ─── Auth ───

export async function signIn(email: string, password: string) {
	return signInWithEmailAndPassword(auth, email, password);
}

export async function logOut() {
	return signOut(auth);
}

export function getCurrentUser(): FirebaseUser | null {
	return auth.currentUser;
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
	return onAuthStateChanged(auth, callback);
}

// ─── Users ───

export async function getUser(uid: string): Promise<User | null> {
	const snap = await getDoc(doc(db, 'users', uid));
	return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
}

export function userStream(uid: string, onData: (user: User | null) => void) {
	return onSnapshot(doc(db, 'users', uid), (snap) => {
		onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null);
	});
}

export async function getAllUsers(): Promise<User[]> {
	const snap = await getDocs(collection(db, 'users'));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
}

export function allUsersStream(onData: (users: User[]) => void, onError?: (err: Error) => void) {
	if (!auth.currentUser) {
		console.warn('[Firestore] Skipped "users" stream — not authenticated');
		return () => {};
	}
	return onSnapshot(
		collection(db, 'users'),
		(snap) => {
			onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User));
		},
		(err) => {
			console.error('[Firestore] Error in "users" collection:', err.message);
			onError?.(err);
		}
	);
}

export async function createUser(
	email: string,
	password: string,
	name: string,
	role: 'Admin' | 'Employee'
) {
	const createUserFn = httpsCallable(functions, 'createUser');
	return createUserFn({ email, password, name, role });
}

export async function updateUser(uid: string, data: Partial<Pick<User, 'name' | 'role'>>) {
	return updateDoc(doc(db, 'users', uid), data);
}

export async function deleteUserCloud(uid: string) {
	const deleteUserFn = httpsCallable(functions, 'deleteUser');
	return deleteUserFn({ userId: uid });
}

// ─── Clients ───

export async function getAllClients(): Promise<Client[]> {
	const snap = await getDocs(collection(db, 'clients'));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
}

export function clientsStream(onData: (clients: Client[]) => void, onError?: (err: Error) => void) {
	if (!auth.currentUser) {
		console.warn('[Firestore] Skipped "clients" stream — not authenticated');
		return () => {};
	}
	return onSnapshot(
		collection(db, 'clients'),
		(snap) => {
			onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
		},
		(err) => {
			console.error('[Firestore] Error in "clients" collection:', err.message);
			onError?.(err);
		}
	);
}

export async function createClient(clientName: string) {
	return addDoc(collection(db, 'clients'), { clientName });
}

export async function updateClient(id: string, clientName: string) {
	return updateDoc(doc(db, 'clients', id), { clientName });
}

export async function deleteClient(id: string) {
	return deleteDoc(doc(db, 'clients', id));
}

// ─── Tasks ───

export function myAssignedTasksStream(
	userId: string,
	onData: (tasks: Task[]) => void,
	onError?: (err: Error) => void
) {
	const q = query(
		collection(db, 'tasks'),
		where('participants', 'array-contains', userId)
	);
	return onSnapshot(
		q,
		(snap) => {
			onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
		},
		(err) => {
			console.error('[Firestore] Error in "tasks" collection:', err.message);
			onError?.(err);
		}
	);
}

export function myCreatedTasksStream(userId: string, onData: (tasks: Task[]) => void) {
	const q = query(
		collection(db, 'tasks'),
		where('participants', 'array-contains', userId),
		orderBy('createdAt', 'desc')
	);
	return onSnapshot(q, (snap) => {
		onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
	});
}

export function allTasksStream(onData: (tasks: Task[]) => void) {
	const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
	return onSnapshot(q, (snap) => {
		onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
	});
}

export function topLevelTaskStream(
	taskId: string,
	onData: (task: Task | null) => void,
	onError?: (err: Error) => void
) {
	return onSnapshot(
		doc(db, 'tasks', taskId),
		(snap) => {
			onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null);
		},
		onError
	);
}

export async function getTopLevelTask(taskId: string): Promise<Task | null> {
	const snap = await getDoc(doc(db, 'tasks', taskId));
	return snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null;
}

export async function createTopLevelTask(data: {
	title: string;
	description: string;
	assigneeIds: string[];
	assignorId: string;
	priority: TaskPriority;
	clientId?: string | null;
}) {
	const participants = [...new Set([data.assignorId, ...data.assigneeIds])];
	return addDoc(collection(db, 'tasks'), {
		...data,
		participants,
		status: 'In Progress' as TaskStatus,
		isClosed: false,
		createdAt: serverTimestamp(),
		updatedAt: null
	});
}

export async function updateTopLevelTask(
	taskId: string,
	data: Partial<
		Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeIds' | 'clientId'>
	>,
	assignorId?: string
) {
	const update: Record<string, unknown> = { ...data };
	if (data.assigneeIds && assignorId) {
		update.participants = [...new Set([assignorId, ...data.assigneeIds])];
	}
	update.updatedAt = serverTimestamp();
	return updateDoc(doc(db, 'tasks', taskId), update);
}

export async function closeTopLevelTask(taskId: string) {
	return updateDoc(doc(db, 'tasks', taskId), {
		isClosed: true,
		status: 'Completed',
		updatedAt: serverTimestamp()
	});
}

export async function reopenTopLevelTask(taskId: string) {
	return updateDoc(doc(db, 'tasks', taskId), {
		isClosed: false,
		updatedAt: serverTimestamp()
	});
}

export async function deleteTopLevelTask(taskId: string) {
	return deleteDoc(doc(db, 'tasks', taskId));
}

// ─── Messages ───

export function taskMessagesStream(
	taskId: string,
	onData: (messages: TaskMessage[]) => void,
	onError?: (err: Error) => void
) {
	const q = query(collection(db, 'tasks', taskId, 'messages'), orderBy('createdAt', 'asc'));
	return onSnapshot(
		q,
		(snap) => {
			onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskMessage));
		},
		(err) => {
			console.error(`[Firestore] Error in "tasks/${taskId}/messages" collection:`, err.message);
			onError?.(err);
		}
	);
}

export async function sendTaskMessage(data: {
	taskId: string;
	senderId: string;
	text: string;
	fileUrl?: string | null;
	participants: string[];
}) {
	return addDoc(collection(db, 'tasks', data.taskId, 'messages'), {
		...data,
		fileUrl: data.fileUrl ?? null,
		createdAt: serverTimestamp()
	});
}

// ─── Files ───

export function taskFilesStream(
	taskId: string,
	onData: (files: TaskFile[]) => void,
	onError?: (err: Error) => void
) {
	const q = query(collection(db, 'tasks', taskId, 'files'), orderBy('uploadedAt', 'desc'));
	return onSnapshot(
		q,
		(snap) => {
			onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskFile));
		},
		(err) => {
			console.error(`[Firestore] Error in "tasks/${taskId}/files" collection:`, err.message);
			onError?.(err);
		}
	);
}

export async function addTaskFile(data: {
	taskId: string;
	uploadedBy: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	mimeType: string;
	participants: string[];
}) {
	return addDoc(collection(db, 'tasks', data.taskId, 'files'), {
		...data,
		status: 'Pending',
		uploadedAt: serverTimestamp(),
		approvedAt: null,
		approvedBy: null,
		rejectionReason: null
	});
}

export async function approveTaskFile(taskId: string, fileId: string, approverId: string) {
	return updateDoc(doc(db, 'tasks', taskId, 'files', fileId), {
		status: 'Approved',
		approvedBy: approverId,
		approvedAt: serverTimestamp()
	});
}

export async function rejectTaskFile(
	taskId: string,
	fileId: string,
	approverId: string,
	reason: string
) {
	return updateDoc(doc(db, 'tasks', taskId, 'files', fileId), {
		status: 'Rejected',
		approvedBy: approverId,
		approvedAt: serverTimestamp(),
		rejectionReason: reason
	});
}

// ─── R2 File Upload ───

export async function uploadFileToR2(file: File): Promise<UploadResult> {
	// Step 1: Get presigned URL from Cloud Function
	let result;
	try {
		const getR2UploadUrl = httpsCallable(functions, 'getR2UploadUrl');
		result = await getR2UploadUrl({ fileName: file.name, contentType: file.type });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to get upload URL';
		console.error('[Upload] Presign step failed:', message, err);
		return { success: false, error: message, step: 'presign', details: err };
	}

	const { presignedUrl, publicUrl } = result.data as {
		presignedUrl: string;
		publicUrl: string;
		key: string;
	};

	// Step 2: Upload file to R2
	let response;
	try {
		response = await fetch(presignedUrl, {
			method: 'PUT',
			body: file,
			headers: { 'Content-Type': file.type }
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Network error during upload';
		console.error('[Upload] Upload step failed:', message, err);
		return { success: false, error: message, step: 'upload', details: err };
	}

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		console.error(`[Upload] Upload step failed: HTTP ${response.status}`, body);
		return {
			success: false,
			error: `Upload failed with status ${response.status}`,
			step: 'upload',
			details: { status: response.status, body }
		};
	}

	return { success: true, publicUrl };
}
