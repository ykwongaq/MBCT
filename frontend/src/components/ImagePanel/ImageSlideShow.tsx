import styles from "./ImageSlideShow.module.css";
import type { Data } from "../../types/Data";
import type { BBox } from "../../types/BBox";
import ImageBlock from "./ImageBlock";

interface ImageSlideShowProps {
	dataList: Data[];
	currentImageId: number | null;
	onGoToIndex: (index: number) => void;
	onRemoveImage: (id: number) => void;
	onBBoxChange: (id: number, bbox: BBox) => void;
}

function ImageSlideShow({
	dataList,
	currentImageId,
	onGoToIndex,
	onRemoveImage,
	onBBoxChange,
}: ImageSlideShowProps) {
	const currentIndex = dataList.findIndex((d) => d.id === currentImageId);
	const current = currentIndex >= 0 ? dataList[currentIndex] : null;

	return (
		<div className={styles.mainRow}>
			<button
				className={styles.navBtn}
				onClick={() => onGoToIndex(currentIndex - 1)}
				disabled={currentIndex <= 0}
				aria-label="Previous image"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</button>

			<div className={styles.mainImageWrap}>
				{current && (
					<>
						<ImageBlock
							data={current}
							onBBoxChange={(bbox) => onBBoxChange(current.id, bbox)}
						/>
						<div className={styles.imageInfo}>
							<span
								className={styles.imageName}
								title={current.image.imageName}
							>
								{current.image.imageName}
							</span>
							<span className={styles.imageCounter}>
								{currentIndex + 1} / {dataList.length}
							</span>
							<button
								className={styles.removeBtn}
								onClick={() => onRemoveImage(current.id)}
								aria-label="Remove image"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>
					</>
				)}
			</div>

			<button
				className={styles.navBtn}
				onClick={() => onGoToIndex(currentIndex + 1)}
				disabled={currentIndex >= dataList.length - 1}
				aria-label="Next image"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>
		</div>
	);
}

export default ImageSlideShow;
