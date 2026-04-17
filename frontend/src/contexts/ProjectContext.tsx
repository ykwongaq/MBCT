import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { ProjectState } from "../types/ProjectState";
import type { ProjectAction } from "../reducers/ProjectReducer";
import { projectReducer, initialProjectState } from "../reducers/ProjectReducer";

export const ProjectContext = createContext<{
	projectState: ProjectState;
	projectDispatch: React.Dispatch<ProjectAction>;
} | null>(null);

export function useProject() {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error("useProject must be used within a ProjectProvider");
	}
	return context;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
	const [projectState, projectDispatch] = useReducer(
		projectReducer,
		initialProjectState,
	);

	return (
		<ProjectContext.Provider value={{ projectState, projectDispatch }}>
			{children}
		</ProjectContext.Provider>
	);
}
