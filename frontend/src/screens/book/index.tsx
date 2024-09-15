import { Outlet } from "react-router-dom"
import { Box, Flex } from "theme-ui"
import ScreenContainer from "../../components/ScreenContainer"
import Sidebar from "./Sidebar"


const BookScreen = () => {
  return (
    <ScreenContainer>
      <Flex sx={{
        height: "50px",
        borderBottom: "1px solid #e0e0e0",
        padding: "16px",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Box>
          <a onClick={() => history.back()}>back</a>
        </Box>
      </Flex>
      <Flex sx={{
        width: "100%",
        height: "100%",
      }}>
        <Sidebar />

        <Box sx={{
          marginLeft: "280px",
          width: "calc(100% - 280px)",
          height: "100%",
          padding: "16px",
        }}>
          <Outlet />
        </Box>

      </Flex>
    </ScreenContainer>
  )
}

export default BookScreen