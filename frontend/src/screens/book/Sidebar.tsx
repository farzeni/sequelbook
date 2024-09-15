import { Box, Flex, Text } from "theme-ui"


const Sidebar = () => {
  return (
    <Box sx={{
      width: "280px",
      position: "fixed",
      height: "100%",
      borderRight: "1px solid #e0e0e0",
      padding: "16px",

    }}>
      <Text sx={{
        fontSize: "18px",
        fontWeight: "bold",
      }}>Summary</Text>


      <Flex sx={{
        flexDirection: "column",
        marginTop: "16px",
        gap: "8px",
      }}>
        <Text>Chapter 1</Text>
        <Text>Chapter 2</Text>
        <Text>Chapter 3</Text>
        <Text>Chapter 4</Text>
      </Flex>

    </Box>
  )

}

export default Sidebar