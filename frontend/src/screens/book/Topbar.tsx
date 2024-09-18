import { Button } from "@/src/components/ui/button";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { FC } from "react";


interface TopbarProps {
  title: string
}

const Topbar: FC<TopbarProps> = ({ title }) => {
  return (
    <div className="flex items-center h-[50px] p-4 border-b-1 gap">
      <div>
        <Button variant="ghost" onClick={() => history.back()}>
          <ChevronLeftIcon />
        </Button>
      </div>

      <div>
        {title}
      </div>
    </div>
  )
}

export default Topbar