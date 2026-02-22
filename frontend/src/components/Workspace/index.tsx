import { Flex, Text } from "@chakra-ui/react"
import { useAtomValue } from "jotai"
import { rootPaneAtom } from "../../store"
import EditorPane from "./EditorPane"

export default function Workspace() {
  const rootPane = useAtomValue(rootPaneAtom)

  if (!rootPane) {
    return (
      <Flex
        align="center"
        justify="center"
        height="100%"
        direction="column"
        gap={2}
      >
        <Text color="fg.subtle" fontSize="sm">
          No books open
        </Text>
        <Text color="fg.subtle" fontSize="xs">
          Open a book from the sidebar to get started
        </Text>
      </Flex>
    )
  }

  return <EditorPane pane={rootPane} />
}
