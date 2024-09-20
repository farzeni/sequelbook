import { Button } from "@/src/components/ui/button";
import { ArchiveIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

const Toolbar = () => {
  return (
    <div className="h-[40px] border-b flex w-full ">
      <div className="pl-2 flex justify-between items-center w-full">
        <h1 className="text-xs">BOOKS</h1>
        <div className="flex items-center pr-1">
          <Button variant="ghost" size="icon">
            <ArchiveIcon width={18} height={18} />
          </Button>
          <Button variant="ghost" size="icon">
            <MagnifyingGlassIcon width={18} height={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;