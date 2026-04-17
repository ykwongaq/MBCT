import styles from "./ImageCollectionBar.module.css";
import type { Data } from "../../types/Data";

interface ImageCollectionBarProps {
	dataList: Data[];
	currentImageId: number | null;
	onSelectImage: (id: number) => void;
	onAddMore: () => void;
}

function ImageCollectionBar({
	dataList,
	currentImageId,
	onSelectImage,
	onAddMore,
}: ImageCollectionBarProps) {
	return (
		<div className={styles.thumbnailRow}>
			{dataList.map((data) => (
				<button
					key={data.id}
					className={`${styles.thumbnail} ${data.id === currentImageId ? styles.thumbnailActive : ""}`}
					onClick={() => onSelectImage(data.id)}
					title={data.image.imageName}
				>
					<img
						src={data.image.imageUrl}
						alt={data.image.imageName}
						className={styles.thumbnailImg}
					/>
				</button>
			))}
			<button
				className={styles.addMoreBtn}
				onClick={onAddMore}
				aria-label="Add more images"
				title="Add more images"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>
		</div>
	);
}

export default ImageCollectionBar;
