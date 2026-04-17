import { useState } from "react";
import styles from "./ImageDropArea.module.css";

interface ImageDropAreaProps {
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onDropFiles: (files: FileList | File[]) => void;
}

function ImageDropArea({ fileInputRef, onDropFiles }: ImageDropAreaProps) {
	const [isDragging, setIsDragging] = useState(false);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		onDropFiles(e.dataTransfer.files);
	};

	return (
		<div
			className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
			onDrop={handleDrop}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onClick={() => fileInputRef.current?.click()}
			role="button"
			tabIndex={0}
			onKeyDown={(e) =>
				e.key === "Enter" && fileInputRef.current?.click()
			}
		>
			<div className={styles.dropzoneIcon}>
				<svg
					width="44"
					height="44"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
			</div>
			<p className={styles.dropzoneText}>
				Drop images here, or{" "}
				<span className={styles.dropzoneLink}>browse files</span>
			</p>
			<p className={styles.dropzoneHint}>PNG, JPG, TIFF supported</p>
		</div>
	);
}

export default ImageDropArea;
