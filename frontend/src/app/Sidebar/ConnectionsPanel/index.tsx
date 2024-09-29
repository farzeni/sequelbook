import { useStore } from "@hooks/store"
import ConnectionsToolbar from "./ConnectionToolbar"


const ConnectionsPanel = () => {
  const connections = useStore((state) => state.connections)

  return (
    <div className="w-full">
      <ConnectionsToolbar />

      <div className="w-full">
        <div className="p-4">
          {Object.values(connections).map((connection) => (
            <div key={connection.id} className={`pl-4 truncate max-w-[90%]  text-xs text-gray-500 py-1`}>
              <div>{connection.name}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ConnectionsPanel