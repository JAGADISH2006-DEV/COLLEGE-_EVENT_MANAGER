import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const resolveImageUrl = (url) => {
    if (!url) return null;

    // Handle Google Drive sharing links
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/(.+?)\/view/) || url.match(/id=(.+?)(&|$)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }

    return url;
};
