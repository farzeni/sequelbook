import { FC } from "react";
import { Box, Flex, Text } from "theme-ui";

interface PageTitleProps {
  title: string;
  children?: React.ReactNode;
}

const PageTitle: FC<PageTitleProps> = ({ title, children }) => {
  return (
    <Flex sx={{
      marginBottom: "16px",
      marginTop: "16px",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <Text sx={{
        fontSize: "24px",
        fontWeight: "bold",
      }}>
        {title}
      </Text>

      <Box>
        {children}
      </Box>
    </Flex>
  )
}

export default PageTitle