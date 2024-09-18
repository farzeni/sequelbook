import { Box, Flex, IconButton } from "@chakra-ui/react";
import { FC } from "react";
import { IoChevronBack } from "react-icons/io5";


interface TopbarProps {
  title: string
}

const Topbar: FC<TopbarProps> = ({ title }) => {
  return (
    <Flex
      height={50}
      paddingY={4}
      alignItems="center"
      gap={2}
      borderBottomWidth={1}>
      <Box>
        <IconButton variant="ghost" icon={<IoChevronBack />} aria-label={"back"} onClick={() => history.back()} />
      </Box>

      <Box>
        {title}
      </Box>
    </Flex>
  )
}

export default Topbar