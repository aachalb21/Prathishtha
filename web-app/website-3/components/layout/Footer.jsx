
export default function Footer() {
  return (
    <footer className="w-full bg-[#ef4444] py-6 border-t-4 border-black text-center">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white border-4 border-black p-4 shadow-[-8px_8px_0px_#000] flex flex-col items-center gap-2">
          <a
            href="https://github.com/prathistha-sakec"
            target="_blank"
            rel="noopener noreferrer"
            className="font-happy-school text-xl text-[#ef4444] underline hover:text-black"
          >
            Made by Web and App Team
          </a>
          <p className="font-comic text-xs text-gray-600">Web Dev Team</p>
          <p className="font-comic text-xs text-gray-600">© 2025 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
