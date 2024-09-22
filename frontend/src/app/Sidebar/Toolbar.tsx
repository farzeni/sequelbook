import { Button } from "@components/ui/button";
import { AddBook } from "@hooks/store";
import { PlusIcon } from "lucide-react";

const Toolbar = () => {



  return (
    <div className="h-[40px] border-b flex w-full ">
      <div className="pl-2 flex justify-between items-center w-full">
        <h1 className="text-xs">BOOKS</h1>
        <div className="flex items-center pr-1">
          <Button variant="ghost" size="icon" onClick={AddBook}>
            <PlusIcon width={18} height={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;