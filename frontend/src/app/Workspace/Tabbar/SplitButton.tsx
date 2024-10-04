import { Button } from "@components/ui/button"
import { ContentPane, DoSplitPane } from "@store"
import { Columns2 } from "lucide-react"
import { FC } from "react"

interface SplitButtonProps {
  pane: ContentPane
}

const SplitButton: FC<SplitButtonProps> = ({ pane }) => {
  function handleSplitPane(e: React.MouseEvent) {
    console.log("Split pane")

    e.stopPropagation()

    DoSplitPane(pane as ContentPane, "vertical")
  }

  return (
    <Button variant="ghost" size="icon" className="p-0" onClick={handleSplitPane}>
      <Columns2 width={18} height={18} className="text-gray-500" />
    </Button>
  )
}

export default SplitButton