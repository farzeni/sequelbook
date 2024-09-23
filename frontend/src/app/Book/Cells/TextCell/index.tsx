import { useDebounce } from "@hooks/debounce";
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
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MarkdownView from 'react-showdown';

const EDITOR_DEBOUNCE = 350
interface TextBlockProps {
  cell: books.Cell
  selected?: boolean
  onChange?: (content: string) => void
}

const TextBlock: FC<TextBlockProps> = ({ cell, selected, onChange }) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)

  const editorRef = useRef<MDXEditorMethods>(null)

  const debouncedOnChange = useDebounce((content: string) => {
    onChange && onChange(content)
  }, EDITOR_DEBOUNCE)

  function handleContentChange(content: string) {
    debouncedOnChange(content)  // Use the debounced version of onChange
  }

  useEffect(() => {
    if (editMode == false && editorRef.current) {
      onChange && onChange(editorRef.current?.getMarkdown())
    }
  }, [editMode])

  useEffect(() => {
    if (!selected) {
      setEditMode(false)
    }
  }, [selected])

  return (
    <div className="w-full prose mx-auto" onDoubleClick={() => !editMode && setEditMode(true)}>
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