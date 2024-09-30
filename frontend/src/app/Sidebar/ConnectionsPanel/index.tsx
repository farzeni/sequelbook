import { useStore } from "@hooks/store"
import ConnectionItem from "./ConnectionItem"
import ConnectionsToolbar from "./ConnectionToolbar"


const ConnectionsPanel = () => {
  const connections = useStore((state) => state.connections)

  return (
    <div className="w-full">
      <ConnectionsToolbar />

      <div className="w-full">
        <div className="p-4">
          {Object.values(connections).map((connection) => (
            <ConnectionItem key={connection.id} connection={connection} />
          ))}
        </div>
      </div>

    </div>
  )
}

export default ConnectionsPanel