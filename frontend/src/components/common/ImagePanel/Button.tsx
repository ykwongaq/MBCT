import styles from "./Button.module.css";

interface ButtonProps {
	onClick: () => void;
	children: React.ReactNode;
	variant?: "default" | "primary" | "danger";
	active?: boolean;
	disabled?: boolean;
	loading?: boolean;
	title?: string;
	icon: React.ReactNode;
}

function Button({
	onClick,
	children,
	variant = "default",
	active = false,
	disabled = false,
	loading = false,
	title,
	icon,
}: ButtonProps) {
	const classNames = [
		styles.btn,
		styles[variant],
		active ? styles.active : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			className={classNames}
			onClick={onClick}
			disabled={disabled || loading}
			title={title}
		>
			{icon}
			{children}
		</button>
	);
}

export default Button;
