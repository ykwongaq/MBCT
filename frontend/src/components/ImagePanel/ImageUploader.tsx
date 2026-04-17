import { useState, useRef } from "react";
import MessageBox from "../../components/common/MessageBox/MessageBox";
import styles from "./ImageUploader.module.css";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import type { Image as AppImage } from "../../types/Image";
import type { BBox } from "../../types/BBox";
import ImageSlideShow from "./ImageSlideShow";
import ImageCollectionBar from "./ImageCollectionBar";

function ImageUploader() {
	const { projectState, projectDispatch } = useProject();
	const { annotationSessionState, annotationSessionDispatch } =
		useAnnotationSession();

	const [isDragging, setIsDragging] = useState(false);
	const [messageBoxOpen, setMessageBoxOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const dataList = projectState.dataList;
	const currentImageId = annotationSessionState.currentImageId;

	const currentIndex = dataList.findIndex((d) => d.id === currentImageId);

	const loadImageDimensions = (
		url: string,
		name: string,
	): Promise<AppImage> => {
		return new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => {
				resolve({
					imageUrl: url,
					imageName: name,
					imageWidth: img.naturalWidth,
					imageHeight: img.naturalHeight,
				});
			};
			img.onerror = reject;
			img.src = url;
		});
	};

	const addFiles = async (files: FileList | File[]) => {
		const imageFiles = Array.from(files).filter((f) =>
			f.type.startsWith("image/"),
		);
		if (imageFiles.length === 0) return;

		const firstNewId =
			dataList.length > 0 ? dataList[dataList.length - 1].id + 1 : 1;

		for (let i = 0; i < imageFiles.length; i++) {
			const file = imageFiles[i];
			const url = URL.createObjectURL(file);
			try {
				const image = await loadImageDimensions(url, file.name);
				projectDispatch({ type: "ADD_IMAGE", payload: { image } });
			} catch {
				URL.revokeObjectURL(url);
			}
		}

		annotationSessionDispatch({
			type: "SET_CURRENT_IMAGE_ID",
			payload: { imageId: firstNewId },
		});
	};

	const removeImage = (id: number) => {
		const idx = dataList.findIndex((d) => d.id === id);
		if (idx >= 0) {
			URL.revokeObjectURL(dataList[idx].image.imageUrl);
		}

		const next = dataList.filter((d) => d.id !== id);
		projectDispatch({ type: "REMOVE_IMAGE", payload: { id } });

		if (currentImageId === id) {
			if (next.length === 0) {
				annotationSessionDispatch({
					type: "SET_CURRENT_IMAGE_ID",
					payload: { imageId: null },
				});
			} else {
				const newIndex = Math.min(currentIndex, next.length - 1);
				annotationSessionDispatch({
					type: "SET_CURRENT_IMAGE_ID",
					payload: { imageId: next[newIndex].id },
				});
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) addFiles(e.target.files);
		e.target.value = "";
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		addFiles(e.dataTransfer.files);
	};

	const goToIndex = (index: number) => {
		if (index >= 0 && index < dataList.length) {
			annotationSessionDispatch({
				type: "SET_CURRENT_IMAGE_ID",
				payload: { imageId: dataList[index].id },
			});
		}
	};

	const handleSelectImage = (id: number) => {
		annotationSessionDispatch({
			type: "SET_CURRENT_IMAGE_ID",
			payload: { imageId: id },
		});
	};

	const handleBBoxChange = (id: number, bbox: BBox) => {
		projectDispatch({ type: "SET_BBOX", payload: { id, bbox } });
	};

	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>Image Analysis</h2>
				<p className={styles.sectionDesc}>
					Upload top-down vertical images of benthic habitats to estimate
					structural complexity metrics. You may drag the bounding box to adjust
					the area of interest.
				</p>
			</div>

			<div className={styles.card}>
				{dataList.length === 0 ? (
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
				) : (
					<div className={styles.viewer}>
						<ImageSlideShow
							dataList={dataList}
							currentImageId={currentImageId}
							onGoToIndex={goToIndex}
							onRemoveImage={removeImage}
							onBBoxChange={handleBBoxChange}
						/>
						<ImageCollectionBar
							dataList={dataList}
							currentImageId={currentImageId}
							onSelectImage={handleSelectImage}
							onAddMore={() => fileInputRef.current?.click()}
						/>
					</div>
				)}
			</div>

			{dataList.length > 0 && (
				<div className={styles.actions}>
					<button
						className={styles.estimateBtn}
						onClick={() => {
							const currentData = dataList.find((d) => d.id === currentImageId);
							if (!currentData?.bbox) {
								setMessageBoxOpen(true);
								return;
							}
						}}
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
							<line x1="18" y1="20" x2="18" y2="10" />
							<line x1="12" y1="20" x2="12" y2="4" />
							<line x1="6" y1="20" x2="6" y2="14" />
						</svg>
						Estimate
					</button>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				className={styles.fileInput}
				onChange={handleFileChange}
			/>

			<MessageBox
				open={messageBoxOpen}
				title="Bounding box required"
				message="Please drag a bounding box on the current image before continuing."
				onClose={() => setMessageBoxOpen(false)}
			/>
		</section>
	);
}

export default ImageUploader;
