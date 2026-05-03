import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Employee';

export interface User {
	id: string;
	name: string;
	email?: string;
	role: UserRole;
	fcmTokens?: string[];
	createdAt?: Timestamp;
	createdBy?: string;
}

export interface Client {
	id: string;
	clientName: string;
}

export type TaskStatus =
	| 'In Progress'
	| 'Review'
	| 'Approved'
	| 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	isClosed: boolean;
	assignorId: string;
	assigneeIds: string[];
	participants: string[];
	clientId: string | null;
	createdAt: Timestamp;
	updatedAt: Timestamp | null;
}

export interface TaskMessage {
	id: string;
	taskId: string;
	senderId: string;
	text: string;
	fileUrl: string | null;
	participants: string[];
	createdAt: Timestamp;
}

export type FileStatus = 'Pending' | 'Approved' | 'Rejected';

export interface TaskFile {
	id: string;
	taskId: string;
	uploadedBy: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	mimeType: string;
	status: FileStatus;
	participants: string[];
	uploadedAt: Timestamp;
	approvedAt: Timestamp | null;
	approvedBy: string | null;
	rejectionReason: string | null;
}

export type UploadStep = 'presign' | 'upload' | 'save';

export interface UploadResult {
	success: boolean;
	publicUrl?: string;
	error?: string;
	step?: UploadStep;
	details?: unknown;
}
