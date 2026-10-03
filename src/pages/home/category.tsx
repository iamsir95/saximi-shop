import TransitionLink from "@/components/transition-link";
import { useAtomValue } from "jotai";
import { categoriesState } from "@/state";

export default function Category() {
  const categories = useAtomValue(categoriesState);
  const homeCategories = categories.filter(
    (category) => category.showOnHome !== false
  );

  return (
    <div className="home-category-strip liquid-card commerce-card grid gap-x-3 gap-y-4 py-4 px-4">
      {homeCategories.map((category) => (
        <TransitionLink
          key={category.id}
          className="flex flex-col items-center gap-2 flex-none overflow-hidden cursor-pointer mx-auto min-w-[72px]"
          to={`/category/${category.id}`}
        >
          <img
            src={category.icon || category.image}
            className="w-14 h-14 object-cover rounded-2xl bg-skeleton ring-2 ring-white/70 shadow-sm"
            alt={category.name}
          />
          <div className="text-center text-[11px] leading-4 w-full line-clamp-2 text-slate-600 font-medium">
            {category.name}
          </div>
        </TransitionLink>
      ))}
    </div>
  );
}
