import { useState } from "react";
import Header from "./components/Header/Header";
import ImageUploader from "./components/ImagePanel/ImageUploader";
import AnalysisPanel from "./components/AnalysisPanel/AnalysisPanel";
import "./App.css";
import { ProjectProvider } from "./contexts/ProjectContext";
import { AnnotationSessionProvider } from "./contexts/AnnotationSessionContext";

function App() {
	const [analysisVisible, setAnalysisVisible] = useState(false);

	return (
		<ProjectProvider>
			<AnnotationSessionProvider>
				<div className="app">
					<Header />
					<main className="app-main">
						<div
							className={`panel-image-wrap${analysisVisible ? " panel-image-wrap--split" : ""}`}
						>
							<div className="panel-image-inner">
								<ImageUploader onEstimate={() => setAnalysisVisible(true)} />
							</div>
						</div>
						{analysisVisible && (
							<div className="panel-analysis-wrap">
								<AnalysisPanel />
							</div>
						)}
					</main>
					<footer className="app-footer">
						<p>
							MonoBenthicComplexTool (MBCT) &mdash; Open-Access AI Tool for
							Structural Complexity Estimation
						</p>
					</footer>
				</div>
			</AnnotationSessionProvider>
		</ProjectProvider>
	);
}

export default App;
