import { createContext, useContext, useReducer } from "react";
import {
	annotationSessionReducer,
	initialAnnotationSession,
	type AnnotationSessionAction,
} from "../reducers/AnnotationSessionReduer";
import type { AnnotationSession } from "../types/AnnotationSession";

export const AnnotationSessionContext = createContext<{
	annotationSessionState: AnnotationSession;
	annotationSessionDispatch: React.Dispatch<AnnotationSessionAction>;
} | null>(null);

export function useAnnotationSession() {
	const context = useContext(AnnotationSessionContext);
	if (!context) {
		throw new Error(
			"useAnnotationSession must be used within an AnnotationSessionProvider",
		);
	}
	return context;
}

export function AnnotationSessionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [annotationSessionState, annotationSessionDispatch] = useReducer(
		annotationSessionReducer,
		initialAnnotationSession,
	);

	return (
		<AnnotationSessionContext.Provider
			value={{ annotationSessionState, annotationSessionDispatch }}
		>
			{children}
		</AnnotationSessionContext.Provider>
	);
}
