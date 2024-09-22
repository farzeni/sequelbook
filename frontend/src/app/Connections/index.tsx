import { Button } from "@components/ui/button"
import { Container } from "@components/ui/container"
import PageTitle from "@components/ui/page-title"
import { ListConnections } from "@lib/wailsjs/go/connections/ConnectionStore"
import { connections } from "@lib/wailsjs/go/models"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"


const ConnectionScreen = () => {
  const [connections, setConnections] = useState<connections.Connection[]>([])

  useEffect(() => {
    const load = async () => {
      const c = await ListConnections()
      setConnections(c || [])
    }

    load()
  }, [])


  async function test(c: connections.Connection) {
    console.log("test")


  }

  return (
    <div>
      <div className="flex flex-col h-[50px] border-b-1 p-4 items-center justify-between">
        <a onClick={() => history.back()}>back</a>
      </div>
      <Container>
        <PageTitle title="Connections">
          <Link to="/connections/new">
            <Button>New Connection</Button>
          </Link>
        </PageTitle>

        <div>
          {connections.map((c, i) => (
            <div key={i} className="flex justify-between p-4 border-b-1">
              <div>{c.name}</div>
              <div>{c.host}</div>
              <div>{c.port}</div>
              <div>{c.user}</div>
              <div>{c.db}</div>

              <Button onClick={() => test(c)}>test</Button>
            </div>
          ))}
        </div>
      </Container>
    </div >
  )
}

export default ConnectionScreen