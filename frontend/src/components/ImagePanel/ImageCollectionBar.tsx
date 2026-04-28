import styles from "./ImageCollectionBar.module.css";
import Thumbnail from "../common/ImagePanel/Thumbnail";
import { PlusIcon } from "./icons";
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
				<Thumbnail
					key={data.id}
					data={data}
					isActive={data.id === currentImageId}
					onClick={() => onSelectImage(data.id)}
				/>
			))}
			<button
				className={styles.addMoreBtn}
				onClick={onAddMore}
				aria-label="Add more images"
				title="Add more images"
			>
				<PlusIcon size={22} />
			</button>
		</div>
	);
}

export default ImageCollectionBar;
