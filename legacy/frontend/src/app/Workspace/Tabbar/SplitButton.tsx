import { Button } from "@components/ui/button"
import { ContentPane, DoSplitPane } from "@store"
import { Columns2, Rows2 } from "lucide-react"
import { FC, useEffect, useState } from "react"

interface SplitButtonProps {
  pane: ContentPane
}

const SplitButton: FC<SplitButtonProps> = ({ pane }) => {
  const [direction, setDirection] = useState<"horizontal" | "vertical">("vertical")

  function handleSplitPane(e: React.MouseEvent) {
    console.log("Split pane")

    e.stopPropagation()

    DoSplitPane(pane as ContentPane, direction)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.altKey) {
      setDirection("horizontal")
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    setDirection("vertical")
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return (
    <Button variant="ghost" size="icon" className="p-0" onClick={handleSplitPane}>
      {direction === "vertical" && (
        <Columns2 width={18} height={18} className="text-gray-500" />
      )}

      {direction === "horizontal" && (
        <Rows2 width={18} height={18} className="text-gray-500" />
      )}
    </Button>
  )
}

export default SplitButton