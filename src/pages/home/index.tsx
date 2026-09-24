import Banners from "./banners";
import Category from "./category";
import CommerceHighlights from "./commerce-highlights";
import FlashSales from "./flash-sales";

const HomePage: React.FunctionComponent = () => {
  return (
    <div className="min-h-full space-y-4 p-3 md:p-4">
      <div className="-mx-3 md:-mx-4 overflow-hidden bg-white/30">
        <Banners />
      </div>
      <CommerceHighlights />
      <Category />
      <FlashSales />
    </div>
  );
};

export default HomePage;
