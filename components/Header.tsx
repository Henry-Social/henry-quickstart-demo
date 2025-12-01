import Link from "next/link";
import HenryWordmark from "@/assets/henry-wordmark";
import CartButton from "@/components/CartButton";

type Props = {
  cartCount?: number;
  showLogo?: boolean;
  onNewChat?: () => void;
};

const Header = ({ cartCount = 0, showLogo = true, onNewChat }: Props) => {
  return (
    <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {showLogo ? (
            <Link href="/" className="inline-flex items-center" aria-label="Go to Henry home">
              <HenryWordmark className="h-8 text-[#44c57e]" />
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <CartButton count={cartCount} />
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="New chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>New Chat</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
