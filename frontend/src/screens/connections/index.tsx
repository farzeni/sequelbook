import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Box, Button, Container, Flex } from "theme-ui"
import { GetAll, Query } from "../../../wailsjs/go/backend/ConnectionStore"
import { backend } from "../../../wailsjs/go/models"
import ScreenContainer from "../../components/ScreenContainer"
import PageTitle from "../../components/ui/PageTitle"


const ConnectionScreen = () => {
  const [connections, setConnections] = useState<backend.Connection[]>([])

  useEffect(() => {
    const load = async () => {
      const c = await GetAll()
      setConnections(c || [])
    }

    load()
  }, [])


  async function test(c: backend.Connection) {
    console.log("test")

    const result = await Query(c.id, "SELECT * FROM users")

    alert(JSON.parse(result))

  }

  return (
    <ScreenContainer>
      <Box sx={{
        height: "50px",
        borderBottom: "1px solid #e0e0e0",
        padding: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <a onClick={() => history.back()}>back</a>
      </Box>
      <Container>
        <PageTitle title="Connections">
          <Link to="/connections/new">
            <Button>New Connection</Button>
          </Link>
        </PageTitle>

        <Box>
          {connections.map((c, i) => (
            <Flex key={i} sx={{
              borderBottom: "1px solid #e0e0e0",
              padding: "16px",
              justifyContent: "space-between",
            }}>
              <Box>{c.name}</Box>
              <Box>{c.host}</Box>
              <Box>{c.port}</Box>
              <Box>{c.user}</Box>
              <Box>{c.db}</Box>

              <Button onClick={() => test(c)}>test</Button>
            </Flex>
          ))}
        </Box>
      </Container>
    </ScreenContainer>
  )
}

export default ConnectionScreen