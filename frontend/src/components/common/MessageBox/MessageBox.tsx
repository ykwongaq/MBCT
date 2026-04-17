import styles from "./MessageBox.module.css";

interface MessageBoxProps {
	open: boolean;
	title?: string;
	message: string;
	onClose: () => void;
}

function MessageBox({ open, title = "Notice", message, onClose }: MessageBoxProps) {
	if (!open) return null;

	return (
		<div
			className={styles.overlay}
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="messagebox-title"
		>
			<div
				className={styles.dialog}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.header}>
					<svg
						className={styles.icon}
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<h3 id="messagebox-title" className={styles.title}>
						{title}
					</h3>
				</div>
				<p className={styles.message}>{message}</p>
				<div className={styles.actions}>
					<button className={styles.okBtn} onClick={onClose}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export default MessageBox;
