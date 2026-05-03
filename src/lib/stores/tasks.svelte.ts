import { myAssignedTasksStream } from '$lib/services/firebase_service';
import type { Task } from '$lib/models';
import { comparePriority } from '$lib/utils';

export function createTasksStore() {
	let tasks = $state<Task[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let unsubscribe: (() => void) | null = null;

	function start(userId: string) {
		stop();

		loading = true;
		error = null;
		unsubscribe = myAssignedTasksStream(
			userId,
			(data) => {
				tasks = data.sort((a, b) => {
					const p = comparePriority(a.priority, b.priority);
					if (p !== 0) return p;
					const aTime = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
					const bTime = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
					return bTime - aTime;
				});
				loading = false;
				error = null;
			},
			(err) => {
				console.error('tasks stream error:', err);
				loading = false;
				error = err.message;
			}
		);
	}

	function stop() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	}

	return {
		get tasks() {
			return tasks;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		start,
		stop
	};
}
