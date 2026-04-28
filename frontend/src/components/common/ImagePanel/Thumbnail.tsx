import styles from "./Thumbnail.module.css";
import type { Data } from "../../../types/Data";

interface ThumbnailProps {
	data: Data;
	isActive: boolean;
	onClick: () => void;
}

function Thumbnail({ data, isActive, onClick }: ThumbnailProps) {
	return (
		<button
			className={`${styles.thumbnail} ${isActive ? styles.thumbnailActive : ""}`}
			onClick={onClick}
			title={data.image.imageName}
		>
			<img
				src={data.image.imageUrl}
				alt={data.image.imageName}
				className={styles.thumbnailImg}
			/>
		</button>
	);
}

export default Thumbnail;
