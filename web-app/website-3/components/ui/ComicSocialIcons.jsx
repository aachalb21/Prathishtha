import React from 'react';

const icons = [
	{
		name: 'Instagram',
		href: 'https://www.instagram.com/pratishtha_sakecfest/',
		svg: (
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="24" cy="24" r="22" fill="#fff" stroke="#000" strokeWidth="2.5" />
				<rect x="10" y="10" width="28" height="28" rx="8" fill="#FFD700" stroke="#000" strokeWidth="3" />
				<circle cx="24" cy="24" r="7" fill="#E1306C" stroke="#000" strokeWidth="2" />
				<circle cx="31" cy="17" r="2" fill="#fff" stroke="#000" strokeWidth="1" />
			</svg>
		),
	},
	{
		name: 'WhatsApp',
		href: 'https://whatsapp.com/channel/0029Vant5jpD38COvx6OuR3w',
		svg: (
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="24" cy="24" r="22" fill="#fff" stroke="#000" strokeWidth="2.5" />
				<rect x="10" y="10" width="28" height="28" rx="8" fill="#25D366" stroke="#000" strokeWidth="3" />
				<path d="M24 18a6 6 0 016 6c0 3.31-2.69 6-6 6a6 6 0 01-6-6c0-3.31 2.69-6 6-6z" fill="#fff" stroke="#000" strokeWidth="2" />
				<path d="M21 27l1-2 2 1 2-1-1 2-2-1z" fill="#25D366" stroke="#000" strokeWidth="1" />
			</svg>
		),
	},
	{
		name: 'YouTube',
		href: 'https://www.youtube.com/@PRATISHTHATheSAKECFest',
		svg: (
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="24" cy="24" r="22" fill="#fff" stroke="#000" strokeWidth="2.5" />
				<rect x="10" y="10" width="28" height="28" rx="8" fill="#FF0000" stroke="#000" strokeWidth="3" />
				<polygon points="21,20 34,24 21,28" fill="#fff" stroke="#000" strokeWidth="1" />
			</svg>
		),
	},
];

export default function ComicSocialIcons() {
	return (
		<div className="flex gap-4 p-2">
			{icons.map(icon => (
				<a
					key={icon.name}
					href={icon.href}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:scale-110 transition-transform drop-shadow-comic"
					aria-label={icon.name}
				>
					{icon.svg}
				</a>
			))}
		</div>
	);
}