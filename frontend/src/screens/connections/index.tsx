import { Box, Button, Container, Flex } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ListConnections } from "../../../wailsjs/go/connections/ConnectionStore"
import { connections } from "../../../wailsjs/go/models"
import ScreenContainer from "../../components/ScreenContainer"
import PageTitle from "../../components/ui/PageTitle"


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