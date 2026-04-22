import styles from "./AddPointButton.module.css";

interface AddPointButtonProps {
	isEditing: boolean;
	onClick: () => void;
}

function AddPointButton({ isEditing, onClick }: AddPointButtonProps) {
	return (
		<button
			className={`${styles.addPointBtn} ${isEditing ? styles.active : ""}`}
			onClick={onClick}
			title={isEditing ? "Stop adding points" : "Add reference points"}
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="3" />
				<line x1="12" y1="2" x2="12" y2="6" />
				<line x1="12" y1="18" x2="12" y2="22" />
				<line x1="2" y1="12" x2="6" y2="12" />
				<line x1="18" y1="12" x2="22" y2="12" />
			</svg>
			{isEditing ? "Stop Adding" : "Add Point"}
		</button>
	);
}

export default AddPointButton;
