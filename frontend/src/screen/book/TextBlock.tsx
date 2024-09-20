import { books } from "@/src/lib/wailsjs/go/models"
import { FC } from "react"

interface TextBlockProps {
  cell: books.Cell
}

const TextBlock: FC<TextBlockProps> = ({ cell }) => {
  return (
    <div>
      text
    </div>
  )
}

export default TextBlock