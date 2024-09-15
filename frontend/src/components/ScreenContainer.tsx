import { Box } from "@chakra-ui/react"
import { FC } from "react"

interface ScreenContainerProps {
  children: React.ReactNode | React.ReactNode[]
}


const ScreenContainer: FC<ScreenContainerProps> = ({ children }) => {
  return (
    <Box>
      {children}
    </Box>
  )
}

export default ScreenContainer
