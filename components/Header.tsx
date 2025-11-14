import Link from "next/link";
import HenryWordmark from "@/assets/henry-wordmark";
import CartButton from "@/components/CartButton";

type Props = {
  cartCount?: number;
};

const Header = ({ cartCount = 0 }: Props) => {
  return (
    <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="inline-flex items-center" aria-label="Go to Henry home">
            <HenryWordmark className="h-8 text-[#44c57e]" />
          </Link>

          <CartButton count={cartCount} />
        </div>
      </div>
    </header>
  );
};

export default Header;
