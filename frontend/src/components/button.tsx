import clsx from 'clsx';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({disabled = false, children, className, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      {...rest}
      className={clsx(
        `${className} flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-primary-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:bg-gray-500`,
      )}
    >
      {children}
    </button>
  );
}
export default Button;