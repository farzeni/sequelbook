import { books } from "@/src/lib/wailsjs/go/models"
import { FC } from "react"

interface CodeBlockProps {
  cell: books.Cell
}

const CodeBlock: FC<CodeBlockProps> = ({ cell }) => {
  return (
    <div>
      code
    </div>
  )
}

export default CodeBlock