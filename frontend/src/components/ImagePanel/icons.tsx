import type { ReactNode } from "react";

interface IconProps {
	size?: number;
	className?: string;
	strokeWidth?: number;
}

function IconBase({
	size = 18,
	className,
	strokeWidth = 2,
	children,
}: IconProps & { children: ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			{children}
		</svg>
	);
}

export function TrashIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<line x1="10" y1="11" x2="10" y2="17" />
			<line x1="14" y1="11" x2="14" y2="17" />
		</IconBase>
	);
}

export function TargetIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<circle cx="12" cy="12" r="3" />
			<line x1="12" y1="2" x2="12" y2="6" />
			<line x1="12" y1="18" x2="12" y2="22" />
			<line x1="2" y1="12" x2="6" y2="12" />
			<line x1="18" y1="12" x2="22" y2="12" />
		</IconBase>
	);
}

export function BarChartIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<line x1="18" y1="20" x2="18" y2="10" />
			<line x1="12" y1="20" x2="12" y2="4" />
			<line x1="6" y1="20" x2="6" y2="14" />
		</IconBase>
	);
}

export function CloseIcon({ size, className, strokeWidth }: IconProps = {}) {
	return (
		<IconBase size={size} className={className} strokeWidth={strokeWidth}>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</IconBase>
	);
}

export function TrashSimpleIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6l-1 14H6L5 6" />
			<path d="M10 11v6M14 11v6" />
			<path d="M9 6V4h6v2" />
		</IconBase>
	);
}

export function PlusIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</IconBase>
	);
}

export function FolderOpenIcon({ size, className }: IconProps = {}) {
	return (
		<IconBase size={size} className={className}>
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
			<polyline points="12 11 12 17" />
			<polyline points="9 14 12 11 15 14" />
		</IconBase>
	);
}
