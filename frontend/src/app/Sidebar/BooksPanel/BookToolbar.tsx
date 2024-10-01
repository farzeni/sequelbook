import { Button } from "@components/ui/button";
import { AddBook } from "@store";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const BookToolbar = () => {
  const { t } = useTranslation();

  return (

    <div className="h-[40px] border-b flex w-full " style={{ "--wails-draggable": "drag" } as React.CSSProperties}>
      <div className="pl-2 flex justify-between items-center w-full">
        <h1 className="text-xs uppercase" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>{t("books", "books")}</h1>
        <div className="flex items-center pr-1">
          <Button variant="ghost" size="icon" onClick={() => AddBook()} style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
            <PlusIcon width={18} height={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookToolbar;