import { Button } from "@components/ui/button";
import { useEventBus } from "@hooks/events";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const ConnectionsToolbar = () => {
  const { t } = useTranslation();
  const events = useEventBus();

  return (
    <div className="h-[40px] border-b flex w-full ">
      <div className="pl-2 flex justify-between items-center w-full">
        <h1 className="text-xs uppercase">{t("connections", "connections")}</h1>
        <div className="flex items-center pr-1">
          <Button variant="ghost" size="icon" onClick={() => events.emit("connections.create")}>
            <PlusIcon width={18} height={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConnectionsToolbar;