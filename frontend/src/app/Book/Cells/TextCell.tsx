import { Textarea } from "@components/ui/textarea";
import { books } from "@lib/wailsjs/go/models";
import { FC, useEffect, useState } from "react";
import MarkdownView from 'react-showdown';

interface TextBlockProps {
  cell: books.Cell
  onChange?: (content: string) => void
}

const TextBlock: FC<TextBlockProps> = ({ cell, onChange }) => {
  const [editMode, setEditMode] = useState(false)
  const [content, setContent] = useState(cell.content)

  useEffect(() => {
    if (editMode == false) {
      onChange && onChange(content)
    }
  }, [editMode])

  return (
    <div className="w-full  px-4 py-2 " onDoubleClick={() => setEditMode(!editMode)}>
      {editMode ? (
        <Textarea
          className="w-full"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
          }} />
      ) :
        content.length > 0 ? (

          <MarkdownView markdown={content} className="prose mx-auto" />
        ) : (
          <div className="prose mx-auto text-gray-500">Double click this cell to edit</div>
        )
      }
    </div>
  )
}

export default TextBlock