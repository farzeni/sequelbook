import { TreeDataItem, TreeView } from "@components/ui/tree-view";
import { appState } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { BookTab } from "@store";
import { FC, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

function extractTitle(markdown: string): string | null {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
      return trimmedLine.substring(2).trim(); // Remove the first "# " and trim the rest
    }
  }
  return null; // Return null if no H1 found
}

interface ChaptersPanelProps {
  tab: BookTab
}

const ChaptersPanel: FC<ChaptersPanelProps> = ({ tab }) => {
  const { t } = useTranslation();
  const cells = useSnapshot(appState.books[tab.bookId]).cells

  const handleItemClick = (cell: books.Cell) => {
    console.log("Item clicked", cell?.id)
    if (!cell) {
      return
    }

    // SelectTable(tab.id, item.id)
  }

  const treeData = useMemo(() => {
    const rootData: TreeDataItem[] = cells.filter(cell => cell.type === "text" && extractTitle(cell.content)).map(cell => {
      const title = extractTitle(cell.content)
      return {
        id: cell.id,
        name: title || "Untitled",
        onClick: () => {
          handleItemClick(cell)
        }
      }
    })

    if (rootData.length === 0) {
      return null
    }

    return [{
      id: "summary",
      name: t("summary", "Summary"),
      children: rootData
    }]
  }, [cells])

  return (
    <div className="h-full">
      <div className="h-[40px] border-b flex w-full ">
        <div className="pl-2 flex justify-between items-center w-full">
          <h1 className="text-xs uppercase">{t("chapters", "Chapters")}</h1>
        </div>
      </div>

      {!!treeData && (
        <div className="h-full overflow-y-auto">
          <TreeView className="text-gray-500 overflow-auto"
            data={treeData}
            initialSelectedItemId="summary"
            expandAll
          />
        </div>
      )}

      {!treeData && (
        <div className="p-4 flex flex-col gap-3">
          <h4 className="font-bold">{t("no-chapters", "Empty Summary")}</h4>
          <p className="text-sm text-secondary">
            <Trans i18nKey="error-db-connection-msg" t={t}>
              It seems your book does not contain any chapters.
            </Trans>
          </p>
          <p className="text-sm text-secondary">
            <Trans i18nKey="error-db-connection-msg" t={t}>
              Add a main title to a text cell to create a chapter.
            </Trans>
          </p>

        </div>
      )}

    </div>
  )
}

export default ChaptersPanel;