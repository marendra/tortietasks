import { taskMessagesStream } from '$lib/services/firebase_service';
import type { TaskMessage } from '$lib/models';

export function createMessagesStore() {
	let messages = $state<TaskMessage[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let unsubscribe: (() => void) | null = null;

	function start(taskId: string) {
		stop();

		loading = true;
		error = null;
		unsubscribe = taskMessagesStream(
			taskId,
			(data) => {
				messages = data;
				loading = false;
				error = null;
			},
			(err) => {
				console.error('messages stream error:', err);
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
		get messages() {
			return messages;
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
