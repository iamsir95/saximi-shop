import { categoriesState } from "@/state";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import TransitionLink from "./transition-link";

export default function CategorySlider() {
  const { id } = useParams();
  const categories = useAtomValue(categoriesState);

  return (
    <div className="px-3 py-2 overflow-x-auto flex gap-2">
      {categories.map((category) => (
        <TransitionLink
          to={`/category/${category.id}`}
          key={category.id}
          className={"h-10 flex-none rounded-2xl p-1 pr-3 flex items-center gap-2 border text-xs font-semibold ".concat(
            String(category.id) === id
              ? "bg-primary text-primaryForeground"
              : "bg-white/70 border-white/80 text-slate-600"
          )}
        >
          <img
            src={category.image}
            className="w-8 h-8 rounded-xl bg-skeleton object-cover"
            alt={category.name}
          />
          <p className="whitespace-nowrap">{category.name}</p>
        </TransitionLink>
      ))}
    </div>
  );
}
