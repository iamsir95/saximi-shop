import { keywordState } from "@/state";
import { useAtom } from "jotai";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CommerceIcon from "./commerce-icon";

type SearchBarProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "onKeyUp" | "onBlur"
>;

const SearchBar = (props: SearchBarProps) => {
  const [localKeyword, setLocalKeyword] = useState("");
  const [keyword, setKeyword] = useAtom(keywordState);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/search" && inputRef.current) {
      inputRef.current.focus();
    }
    return () => {
      setKeyword("");
    };
  }, [location]);

  return (
    <form
      role="search"
      aria-label="Tìm kiếm sản phẩm"
      className="commerce-search border-none outline-none m-0"
      style={{
        viewTransitionName: "search-bar",
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setKeyword(localKeyword.trim());
      }}
    >
      <button className="commerce-search__button" type="submit" aria-label="Tìm kiếm">
        <CommerceIcon name="search" size={18} />
      </button>
      <input
        ref={inputRef}
        type="search"
        placeholder="Tìm sản phẩm, danh mục..."
        className="commerce-search__input"
        value={localKeyword}
        onChange={(e) => setLocalKeyword(e.currentTarget.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            setKeyword(localKeyword.trim());
          }
        }}
        onBlur={() => setKeyword(localKeyword.trim())}
        {...props}
      />
      {localKeyword && (
        <button
          className="commerce-search__clear"
          type="button"
          aria-label="Xóa nội dung tìm kiếm"
          onClick={() => {
            setLocalKeyword("");
            setKeyword("");
            inputRef.current?.focus();
          }}
        >
          ×
        </button>
      )}
    </form>
  );
};

export default SearchBar;
