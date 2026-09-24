import TransitionLink from "@/components/transition-link";
import { useAtomValue } from "jotai";
import { categoriesState } from "@/state";

export default function CategoryListPage() {
  const categories = useAtomValue(categoriesState);

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-section sm:grid-cols-4 md:grid-cols-5">
      {categories.map((category) => (
        <TransitionLink
          key={category.id}
          className="liquid-card commerce-card flex flex-col items-center gap-2 overflow-hidden cursor-pointer p-3 text-center"
          to={`/category/${category.id}`}
        >
          <img
            src={category.image}
            className="w-16 h-16 object-cover rounded-2xl bg-skeleton"
            alt={category.name}
          />
          <div className="text-xs font-semibold leading-4 w-full line-clamp-2 text-slate-700">
            {category.name}
          </div>
        </TransitionLink>
      ))}
    </div>
  );
}
