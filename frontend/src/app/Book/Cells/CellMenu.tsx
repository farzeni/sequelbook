import { ArrowDown, ArrowUp } from "lucide-react"
import { FC } from "react"

interface CellMenuProps {
  children: React.ReactNode | React.ReactNode[]
}

const CellMenu: FC<CellMenuProps> = ({ children }) => {
  return (
    <div className="absolute z-10 flex gap-1 bg-white border border-gray-200 rounded right-2 top-[-16px] h-[32px]">
      <div className="flex justify-center items-center w-[30px] cursor-pointer" >
        <ArrowUp size={18} />
      </div>
      <div className="flex justify-center items-center w-[30px] cursor-pointer" >
        <ArrowDown size={18} />
      </div>
      {children}
    </div>
  )
}

export default CellMenu