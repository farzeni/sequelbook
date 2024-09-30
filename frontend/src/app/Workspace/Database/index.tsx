import { FC } from "react";

interface DatabaseContentProps {
  connectionId: string
}

const DatabaseContent: FC<DatabaseContentProps> = ({ connectionId }) => {
  return (
    <div>
      <h1>Database {connectionId}</h1>
    </div>
  );
}

export default DatabaseContent;