import { Link } from "react-router-dom"
import { Box, Container } from "theme-ui"
import ScreenContainer from "../components/ScreenContainer"
import PageTitle from "../components/ui/PageTitle"

const IndexScreen = () => {
  return (
    <ScreenContainer>
      <Container>
        <PageTitle title="Index" />

        <Box>
          <Link to="/connections">connections</Link>
        </Box>
        <Box>
          <Link to="/book/dasdsa/dadsa">book</Link>
        </Box>
      </Container>
    </ScreenContainer>
  )
}

export default IndexScreen