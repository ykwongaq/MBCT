import styles from "./ErrorBox.module.css";

interface ErrorBoxProps {
	open: boolean;
	title?: string;
	message: string;
	onClose: () => void;
}

function ErrorBox({ open, title = "Error", message, onClose }: ErrorBoxProps) {
	if (!open) return null;

	return (
		<div
			className={styles.overlay}
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="errorbox-title"
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
						<line x1="15" y1="9" x2="9" y2="15" />
						<line x1="9" y1="9" x2="15" y2="15" />
					</svg>
					<h3 id="errorbox-title" className={styles.title}>
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

export default ErrorBox;
