import { books } from "@/src/lib/wailsjs/go/models";
import { FC } from "react";
import ChapterToolbar from "./Toolbar";

interface ChapterScreenProps {
  book: books.Book
}

const ChapterScreen: FC<ChapterScreenProps> = ({ book }) => {
  return (
    <div>
      <ChapterToolbar book={book} />
      <h1>Chapter Screen</h1>
    </div>
  );
}

export default ChapterScreen;