import { PropsWithChildren, ReactNode } from "react";

export interface SectionProps {
  title: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Section(props: PropsWithChildren<SectionProps>) {
  return (
    <div
      className={"liquid-card commerce-card ".concat(props.className ?? "")}
      onClick={props.onClick}
    >
      <div className="flex items-center justify-between px-3">
        <div className="commerce-title p-3 pb-2 w-full">
          {props.title}
        </div>
      </div>
      {props.children}
    </div>
  );
}
