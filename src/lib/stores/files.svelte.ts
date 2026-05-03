import { taskFilesStream } from '$lib/services/firebase_service';
import type { TaskFile } from '$lib/models';

export function createFilesStore() {
	let files = $state<TaskFile[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let unsubscribe: (() => void) | null = null;

	function start(taskId: string) {
		stop();

		loading = true;
		error = null;
		unsubscribe = taskFilesStream(
			taskId,
			(data) => {
				files = data;
				loading = false;
				error = null;
			},
			(err) => {
				console.error('files stream error:', err);
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
		get files() {
			return files;
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
