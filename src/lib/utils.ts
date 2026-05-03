export function formatDate(
	ts: { seconds: number; nanoseconds: number } | Date | null | undefined
): string {
	if (!ts) return '-';
	const date = ts instanceof Date ? ts : new Date(ts.seconds * 1000);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
	return classes.filter(Boolean).join(' ');
}

const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export function comparePriority(a: string, b: string): number {
	return (priorityOrder[b] ?? 0) - (priorityOrder[a] ?? 0);
}
