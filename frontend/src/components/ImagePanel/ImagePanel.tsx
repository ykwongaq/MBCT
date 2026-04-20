import { useState, useRef } from "react";
import MessageBox from "../../components/common/MessageBox/MessageBox";
import ErrorBox from "../../components/common/MessageBox/ErrorBox";
import styles from "./ImagePanel.module.css";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import type { Image as AppImage } from "../../types/Image";
import type { BBox } from "../../types/BBox";
import ImageSlideShow from "./ImageSlideShow";
import ImageCollectionBar from "./ImageCollectionBar";
import ImageDropArea from "./ImageDropArea";
import EstimateButton from "./EstimateButton";
import { estimateDepth } from "../../services/DepthPredictionService";

interface Props {
	onEstimate?: () => void;
}

function cropImage(imageUrl: string, bbox: BBox): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(bbox.width);
			canvas.height = Math.round(bbox.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("No canvas context"));
				return;
			}
			ctx.drawImage(
				img,
				Math.round(bbox.x_top_left),
				Math.round(bbox.y_top_left),
				Math.round(bbox.width),
				Math.round(bbox.height),
				0,
				0,
				Math.round(bbox.width),
				Math.round(bbox.height),
			);
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error("Canvas toBlob failed"));
				},
				"image/jpeg",
				0.95,
			);
		};
		img.onerror = reject;
		img.src = imageUrl;
	});
}

function ImagePanel({ onEstimate }: Props) {
	const { projectState, projectDispatch } = useProject();
	const { annotationSessionState, annotationSessionDispatch } =
		useAnnotationSession();

	const [messageBoxOpen, setMessageBoxOpen] = useState(false);
	const [errorBoxOpen, setErrorBoxOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isEstimating, setIsEstimating] = useState(false);
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

	const handleEstimate = async () => {
		const currentData = dataList.find((d) => d.id === currentImageId);
		if (!currentData?.bbox) {
			setMessageBoxOpen(true);
			return;
		}

		setIsEstimating(true);
		try {
			const blob = await cropImage(
				currentData.image.imageUrl,
				currentData.bbox,
			);
			estimateDepth(blob, {
				onComplete: (depthMap) => {
					projectDispatch({
						type: "SET_DEPTH_MAP",
						payload: { id: currentImageId!, depthMap },
					});
					setIsEstimating(false);
					onEstimate?.();
				},
				onError: (error) => {
					setErrorMessage(error.message || "Depth estimation failed.");
					setErrorBoxOpen(true);
					setIsEstimating(false);
				},
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to crop image.";
			setErrorMessage(msg);
			setErrorBoxOpen(true);
			setIsEstimating(false);
		}
	};

	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>Image Analysis</h2>
				<p className={styles.sectionDesc}>
					Upload top-down vertical images of benthic habitats to estimate
					structural complexity metrics. <br /> You a drag the bounding box to
					adjust the area of interest.
				</p>
			</div>

			<div className={styles.card}>
				{dataList.length === 0 ? (
					<ImageDropArea fileInputRef={fileInputRef} onDropFiles={addFiles} />
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
				<EstimateButton onClick={handleEstimate} loading={isEstimating} />
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

			<ErrorBox
				open={errorBoxOpen}
				title="Estimation failed"
				message={errorMessage}
				onClose={() => setErrorBoxOpen(false)}
			/>
		</section>
	);
}

export default ImagePanel;
