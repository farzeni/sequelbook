import { CELL_BINDINGS } from "@app/Workspace/Book/keybindngs";
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
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MarkdownView from 'react-showdown';
import CellMenu from "../CellMenu";

const EDITOR_DEBOUNCE = 350
interface TextBlockProps {
  bookId: string
  cell: books.Cell
  selected?: boolean
  onChange?: (cellId: string, content: string) => void
}

const TextBlock: FC<TextBlockProps> = ({ bookId, cell, selected, onChange }) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)
  const [isMouseOver, setIsMouseOver] = useState(false)

  const editorRef = useRef<MDXEditorMethods>(null)

  const debouncedOnChange = useDebounce((content: string) => {
    onChange && onChange(cell.id, content)
  }, EDITOR_DEBOUNCE)


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd && e.key === CELL_BINDINGS.CELL_NEXT) {
      e.preventDefault()
      SelectNextCell()
    }

    if (isCtrlOrCmd && e.key === CELL_BINDINGS.CELL_PREVIOUS) {
      e.preventDefault()
      SelectPreviousCell()
    }

    if (isCtrlOrCmd && e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      setEditMode(false)
    }
  }, [])

  useEffect(() => {
    if (editMode == false && editorRef.current) {
      onChange && onChange(cell.id, editorRef.current?.getMarkdown())
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
    <div className="w-full prose mx-auto relative" onDoubleClick={() => !editMode && setEditMode(true)}
      onMouseEnter={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)}>
      {(selected || isMouseOver) && (
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
          onChange={debouncedOnChange} />

      ) :
        cell.content.length > 0 ? (
          <div className="pt-2">
            <MarkdownView markdown={cell.content} />
          </div>
        ) : (
          <div className="py-2 text-gray-500">{t("doubleClickToEdit", "Double click this cell to edit")}</div>
        )
      }
    </div >
  )
}

export default React.memo(TextBlock)