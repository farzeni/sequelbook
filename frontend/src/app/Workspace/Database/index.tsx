import { DatabaseTab } from "@store";
import { FC } from "react";

interface DatabaseContentProps {
  tab: DatabaseTab
}

const DatabaseContent: FC<DatabaseContentProps> = ({ tab }) => {
  return (
    <div>
      <h1>Database {tab.connectionId}</h1>
    </div>
  );
}

export default DatabaseContent;