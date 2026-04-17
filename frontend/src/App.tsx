import Header from "./components/Header/Header";
import ImageUploader from "./components/ImagePanel/ImageUploader";
import "./App.css";
import { ProjectProvider } from "./contexts/ProjectContext";
import { AnnotationSessionProvider } from "./contexts/AnnotationSessionContext";

function App() {
	return (
		<ProjectProvider>
			<AnnotationSessionProvider>
				<div className="app">
					<Header />
					<main className="app-main">
						<ImageUploader />
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
