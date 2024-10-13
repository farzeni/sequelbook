import { Button } from "@components/ui/button"
import { connections } from "@lib/wailsjs/go/models"
import { PlusIcon } from "@radix-ui/react-icons"
import { AddCell } from "@store"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import ConnectionMenu from "./ConnectionMenu"

interface ConnectionToolbarProps {
  connection: connections.Connection
}

const ConnectionToolbar: FC<ConnectionToolbarProps> = ({ connection }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center h-[42px] justify-between relative">
      <div className="flex items-center gap-2 ml-2">
        <Button variant="ghost" size="sm" onClick={() => AddCell("code")}>
          <div className="flex items-center gap-1">
            <span>{t("data", "Data")}</span>
          </div>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => AddCell("text")}>
          <div className="flex items-center gap-1">
            <span>{t("structure", "Structure")}</span>
          </div>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => AddCell("text")}>
          <div className="flex items-center gap-1">
            <PlusIcon width={18} height={18} />

            <span>{t("addRow", "Add Row")}</span>
          </div>
        </Button>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
        {connection.name}
      </div>

      <div className="flex items-center gap-2 mr-2">
        <Button variant="outline" size="sm" onClick={() => AddCell("text")} disabled>
          <div className="flex items-center gap-1">
            <span>{t("save-changes", "Save changes")}</span>
          </div>
        </Button>

        <ConnectionMenu connection={connection} />
      </div>

    </div>
  )
}

export default ConnectionToolbar