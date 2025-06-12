import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { icon: Github, href: 'https://github.com/ShahKrish25', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/KrishShah_09', label: 'Twitter' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/krishshah09/', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} ChatPro. All rights reserved.
          </p>
          <div className="flex space-x-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}