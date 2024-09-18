import { Box } from "@chakra-ui/react";
import { FC } from "react";
import { books } from "../../../../wailsjs/go/models";
import ChapterToolbar from "./Toolbar";

interface ChapterScreenProps {
  book: books.Book
}

const ChapterScreen: FC<ChapterScreenProps> = ({ book }) => {
  return (
    <Box>
      <ChapterToolbar book={book} />
      <h1>Chapter Screen</h1>
    </Box>
  );
}

export default ChapterScreen;