import { CELL_BINDINGS } from "@app/Book/keybindngs";
import { useDebounce } from "@hooks/debounce";
import { SelectNextCell, SelectPreviousCell } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin, ListsToggle, markdownShortcutPlugin, MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { SaveIcon } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MarkdownView from 'react-showdown';
import CellMenu from "../CellMenu";

const EDITOR_DEBOUNCE = 350
interface TextBlockProps {
  bookId: string
  cell: books.Cell
  selected?: boolean
  onChange?: (content: string) => void
}

const TextBlock: FC<TextBlockProps> = ({ bookId, cell, selected, onChange }) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)

  const editorRef = useRef<MDXEditorMethods>(null)

  const debouncedOnChange = useDebounce((content: string) => {
    onChange && onChange(content)
  }, EDITOR_DEBOUNCE)

  function handleContentChange(content: string) {
    debouncedOnChange(content)  // Use the debounced version of onChange
  }

  function handleKeyDown(e: KeyboardEvent) {
    console.log("e.key", e.key)
    if (e.key === "Control-" + CELL_BINDINGS.CELL_NEXT) {
      e.preventDefault()
      SelectNextCell()
    }

    if (e.key === "Control-" + CELL_BINDINGS.CELL_PREVIOUS) {
      e.preventDefault()
      SelectPreviousCell()
    }
  }

  useEffect(() => {
    if (editMode == false && editorRef.current) {
      onChange && onChange(editorRef.current?.getMarkdown())
    }
  }, [editMode])

  useEffect(() => {
    if (selected) {
      document.addEventListener('keydown', handleKeyDown)
    } else {
      setEditMode(false)
      document.removeEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selected])



  return (
    <div className="w-full prose mx-auto relative" onDoubleClick={() => !editMode && setEditMode(true)} >
      {selected && (
        <CellMenu cell={cell} bookId={bookId}>
          <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={() => setEditMode(false)}>
            <SaveIcon size={18} />
          </div>
        </CellMenu>
      )}

      {editMode ? (
        <MDXEditor
          className="mt-[-20px]"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'sql' }),
            codeMirrorPlugin({ codeBlockLanguages: { sql: 'SQL' } }),
            imagePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <BlockTypeSelect />
                  {' '}

                  <BoldItalicUnderlineToggles />
                  <ListsToggle options={["bullet", "number"]} />
                  <CreateLink />
                  <CodeToggle />
                  <UndoRedo />
                </>
              )
            })
          ]}
          ref={editorRef}
          markdown={cell.content}
          onChange={handleContentChange} />

      ) :
        cell.content.length > 0 ? (
          <div className="pt-2">
            <MarkdownView markdown={cell.content} />
          </div>
        ) : (
          <div className="py-2 text-gray-500">{t("doubleClickToEdit", "Double click this cell to edit")}</div>
        )
      }
    </div>
  )
}

export default TextBlock