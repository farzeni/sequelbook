import { Button } from "@/src/components/ui/button"
import { PlusIcon } from "@radix-ui/react-icons"

const BookToolbar = () => {
  return (
    <div className="flex gap-2 items-center p-2 border-b">

      <Button variant="outline" size="sm">
        <div className="flex items-center gap-1">
          <PlusIcon width={18} height={18} />
          <span>Text</span>
        </div>
      </Button>

      <Button variant="outline" size="sm">
        <div className="flex items-center gap-1">
          <PlusIcon width={18} height={18} />
          <span>Code</span>
        </div>
      </Button>
    </div>
  )
}

export default BookToolbar