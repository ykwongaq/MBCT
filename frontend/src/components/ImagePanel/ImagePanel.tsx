import { useState, useRef } from "react";
import MessageBox from "../../components/common/MessageBox/MessageBox";
import styles from "./ImagePanel.module.css";
import { useProject } from "../../contexts/ProjectContext";
import { useAnnotationSession } from "../../contexts/AnnotationSessionContext";
import type { Image as AppImage } from "../../types/Image";
import ImageSlideShow from "./ImageSlideShow";
import ImageCollectionBar from "./ImageCollectionBar";
import ImageDropArea from "./ImageDropArea";
import Button from "../../components/common/ImagePanel/Button";
import { TrashIcon, TargetIcon, BarChartIcon } from "./icons";
import type { BBox } from "../../types/BBox";
import BoundingBoxList from "./BoundingBoxList";

interface Props {
	onEstimate?: () => void;
}

function ImagePanel({ onEstimate }: Props) {
	const { projectState, projectDispatch } = useProject();
	const { annotationSessionState, annotationSessionDispatch } =
		useAnnotationSession();

	const [messageBoxOpen, setMessageBoxOpen] = useState(false);
	const [liveDragBox, setLiveDragBox] = useState<BBox | null>(null);
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

	const handleNewBBoxDrawn = (bbox: BBox) => {
		projectDispatch({ type: "ADD_BBOX_TEMPLATE", payload: { bbox } });
	};

	const handleApplyTemplate = (bbox: BBox) => {
		if (currentImageId === null) return;
		const current = dataList.find((d) => d.id === currentImageId);
		if (!current) return;
		const centered: BBox = {
			x_top_left: (current.image.imageWidth - bbox.width) / 2,
			y_top_left: (current.image.imageHeight - bbox.height) / 2,
			width: bbox.width,
			height: bbox.height,
		};
		projectDispatch({ type: "SET_BBOX", payload: { id: currentImageId, bbox: centered } });
	};

	const handleRemoveTemplate = (id: number) => {
		projectDispatch({ type: "REMOVE_BBOX_TEMPLATE", payload: { id } });
	};

	const handleEstimate = () => {
		const currentData = dataList.find((d) => d.id === currentImageId);
		if (!currentData?.bbox) {
			setMessageBoxOpen(true);
			return;
		}
		onEstimate?.();
	};

	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>Image Analysis</h2>
				<p className={styles.sectionDesc}>
					Upload vertically-oriented, top-down photos of underwater habitats to
					measure structural complexity. <br /> Drag the bounding box to select
					the area you want to analyze. <br /> Mark at least two reference
					points with a known real-world distance to the camera so we can
					calculate colony height.
				</p>
			</div>

			<div className={styles.card}>
				{dataList.length === 0 ? (
					<ImageDropArea fileInputRef={fileInputRef} onDropFiles={addFiles} />
				) : (
					<div className={styles.viewer}>
						<div className={styles.mainContent}>
							<ImageSlideShow
								dataList={dataList}
								currentImageId={currentImageId}
								onGoToIndex={goToIndex}
								onRemoveImage={removeImage}
								onBBoxChange={handleBBoxChange}
								onDragBBoxChange={setLiveDragBox}
								onNewBBoxDrawn={handleNewBBoxDrawn}
							/>
							<ImageCollectionBar
								dataList={dataList}
								currentImageId={currentImageId}
								onSelectImage={handleSelectImage}
								onAddMore={() => fileInputRef.current?.click()}
							/>
							<BoundingBoxList
								templates={projectState.bboxTemplates}
								liveDragBox={liveDragBox}
								onApplyTemplate={handleApplyTemplate}
								onRemoveTemplate={handleRemoveTemplate}
							/>
						</div>
					</div>
				)}
			</div>

			{dataList.length > 0 && (
				<div className={styles.actions}>
					<Button
						variant="danger"
						disabled={
							(dataList.find((d) => d.id === currentImageId)?.referencePoints
								?.length ?? 0) === 0
						}
						onClick={() =>
							projectDispatch({
								type: "CLEAR_REFERENCE_POINTS",
								payload: { id: currentImageId! },
							})
						}
						title="Clear all reference points"
						icon={<TrashIcon />}
					>
						Clear Points
					</Button>
					<Button
						variant="default"
						active={annotationSessionState.isEditingReferencePoints}
						onClick={() =>
							annotationSessionDispatch({
								type: "TOGGLE_IS_EIDITING_REFERENCE_POINT",
								payload: {},
							})
						}
						title={
							annotationSessionState.isEditingReferencePoints
								? "Stop adding points"
								: "Add reference points"
						}
						icon={<TargetIcon />}
					>
						{annotationSessionState.isEditingReferencePoints
							? "Stop Adding"
							: "Add Point"}
					</Button>
					<Button
						variant="primary"
						onClick={handleEstimate}
						loading={false}
						icon={<BarChartIcon />}
					>
						Estimate
					</Button>
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

export default ImagePanel;
