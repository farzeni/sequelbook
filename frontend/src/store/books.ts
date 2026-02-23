import { atom } from "jotai"
import { activeConnectionIdAtom, activeEntryIdAtom, blockContentRegistryAtom, booksAtom, cellStatesAtom, connectionsAtom, editorAtom } from "./atoms"
import { connectAtom } from "./connections"
import { currentTabAtom, openInTabAtom, closeTabAtom, selectTabAtom } from "./editor"
import { convertQueryResponse, disposeResultAtom, storeResultAtom, setCellStateAtom } from "./results"
import * as BookService from "@/bindings/github.com/sequelbook/sequelbook/bindings/bookservice"
import * as QueryService from "@/bindings/github.com/sequelbook/sequelbook/bindings/queryservice"
import type { Block, BlockType, OpenBook } from "./types"

// ─── Auto-save atom ──────────────────────────────────────────────────────────

/** Triggers a backend save of all dirty books. Called periodically by useAutoSave. */
export const autoSaveAtom = atom(null, async () => {
  await BookService.SaveAllDirty()
})

// ─── Derived read atoms ───────────────────────────────────────────────────────

/** The OpenBook for the currently active BookTab, or undefined. */
export const currentBookAtom = atom<OpenBook | undefined>((get) => {
  const tab = get(currentTabAtom)
  if (!tab || tab.type !== "book") return undefined
  return get(booksAtom)[tab.bookId]
})

// ─── Write atoms ─────────────────────────────────────────────────────────────

/** Load all books from the backend into the atom. */
export const loadBooksAtom = atom(null, async (_get, set) => {
  const books = await BookService.ListBooks()
  const map: Record<string, OpenBook> = {}
  for (const ob of books) {
    if (ob?.book) {
      map[ob.book.id] = ob
    }
  }
  set(booksAtom, map)
})

/** Create a new book and open it in the current pane. */
export const addBookAtom = atom(
  null,
  async (_get, set, title: string = "Untitled") => {
    const ob = await BookService.CreateBook(title)
    if (!ob?.book) return null
    set(booksAtom, (prev) => ({ ...prev, [ob.book!.id]: ob }))
    set(openInTabAtom, { entityType: "book", entityId: ob.book.id })
    return ob
  }
)

/** Update a book's title. Optimistic local update + backend sync so auto-save picks it up. */
export const updateBookTitleAtom = atom(
  null,
  async (_get, set, args: { bookId: string; title: string }) => {
    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, title: args.title },
          dirty: true,
        },
      }
    })
    await BookService.RenameBook(args.bookId, args.title)
  }
)

/** Remove a book, close all its tabs, and tell the backend. */
export const removeBookAtom = atom(
  null,
  async (get, set, bookId: string) => {
    const editorState = get(editorAtom)
    for (const tabId in editorState.tabs) {
      const tab = editorState.tabs[tabId]
      if (tab.type === "book" && tab.bookId === bookId) {
        set(closeTabAtom, tabId)
      }
    }
    set(booksAtom, (prev) => {
      const next = { ...prev }
      delete next[bookId]
      return next
    })
    await BookService.CloseBook(bookId)
  }
)

/** Permanently delete a book: close its tabs, remove from state, delete file on disk. */
export const deleteBookAtom = atom(
  null,
  async (get, set, bookId: string) => {
    const editorState = get(editorAtom)
    for (const tabId in editorState.tabs) {
      const tab = editorState.tabs[tabId]
      if (tab.type === "book" && tab.bookId === bookId) {
        set(closeTabAtom, tabId)
      }
    }
    set(booksAtom, (prev) => {
      const next = { ...prev }
      delete next[bookId]
      return next
    })
    await BookService.DeleteBook(bookId)
  }
)

// ─── Chapter write atoms ──────────────────────────────────────────────────────

export const addChapterAtom = atom(
  null,
  async (_get, set, args: { bookId: string; title?: string }) => {
    const chapter = await BookService.AddChapter(args.bookId, args.title ?? "New Chapter")
    if (!chapter) return null
    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: {
            ...ob.book,
            chapters: [...ob.book.chapters, chapter],
          },
          dirty: true,
        },
      }
    })
    return chapter
  }
)

// ─── Block write atoms ────────────────────────────────────────────────────────

/** Add a block to a section. If position is undefined, appends at the end (-1). */
export const addBlockAtom = atom(
  null,
  async (
    _get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      type: BlockType
      position?: number
    }
  ) => {
    const block = await BookService.AddBlock(
      args.bookId,
      args.chapterId,
      args.sectionId,
      args.type,
      args.position ?? -1
    )
    if (!block) return null

    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      const chapters = ob.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            const blocks = [...sec.blocks]
            if (args.position !== undefined && args.position >= 0) {
              blocks.splice(args.position, 0, block)
            } else {
              blocks.push(block)
            }
            return { ...sec, blocks }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, chapters },
          dirty: true,
        },
      }
    })
    return block
  }
)

/** Update a block's content. Optimistic local update + fire-and-forget backend call. */
export const updateBlockAtom = atom(
  null,
  async (
    _get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      blockId: string
      content: string
    }
  ) => {
    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      const chapters = ob.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            return {
              ...sec,
              blocks: sec.blocks.map((blk) =>
                blk.id === args.blockId
                  ? { ...blk, content: args.content }
                  : blk
              ),
            }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, chapters },
          dirty: true,
        },
      }
    })
    BookService.UpdateBlock(args.bookId, args.chapterId, args.sectionId, args.blockId, args.content)
  }
)

/** Update a block's page size for result pagination. Persists to the book file. */
export const updateBlockPageSizeAtom = atom(
  null,
  async (
    _get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      blockId: string
      pageSize: number
    }
  ) => {
    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      const chapters = ob.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            return {
              ...sec,
              blocks: sec.blocks.map((blk) =>
                blk.id === args.blockId
                  ? { ...blk, pageSize: args.pageSize }
                  : blk
              ),
            }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, chapters },
          dirty: true,
        },
      }
    })
    BookService.UpdateBlockPageSize(
      args.bookId,
      args.chapterId,
      args.sectionId,
      args.blockId,
      args.pageSize
    ).catch((err) => console.warn("UpdateBlockPageSize failed:", err))
  }
)

/** Remove a block. */
export const removeBlockAtom = atom(
  null,
  async (
    _get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      blockId: string
    }
  ) => {
    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      const chapters = ob.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            return {
              ...sec,
              blocks: sec.blocks.filter((blk) => blk.id !== args.blockId),
            }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, chapters },
          dirty: true,
        },
      }
    })
    await BookService.RemoveBlock(args.bookId, args.chapterId, args.sectionId, args.blockId)
  }
)

/** Move a block up or down within its section. */
export const moveBlockAtom = atom(
  null,
  async (
    _get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      blockId: string
      direction: "up" | "down"
    }
  ) => {
    // Compute the new position for the backend call
    let newPosition = -1

    set(booksAtom, (prev) => {
      const ob = prev[args.bookId]
      if (!ob || !ob.book) return prev
      const chapters = ob.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            const blocks = [...sec.blocks]
            const idx = blocks.findIndex((b) => b.id === args.blockId)
            if (idx === -1) return sec
            const swapIdx = args.direction === "up" ? idx - 1 : idx + 1
            if (swapIdx < 0 || swapIdx >= blocks.length) return sec
            ;[blocks[idx], blocks[swapIdx]] = [blocks[swapIdx], blocks[idx]]
            newPosition = swapIdx
            return { ...sec, blocks }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...ob,
          book: { ...ob.book, chapters },
          dirty: true,
        },
      }
    })
    if (newPosition >= 0) {
      await BookService.MoveBlock(args.bookId, args.chapterId, args.sectionId, args.blockId, newPosition)
    }
  }
)

/** Duplicate a block by inserting a new block of the same type+content immediately after it. */
export const duplicateBlockAtom = atom(
  null,
  async (
    get,
    set,
    args: {
      bookId: string
      chapterId: string
      sectionId: string
      blockId: string
    }
  ) => {
    const books = get(booksAtom)
    const ob = books[args.bookId]
    const section = ob?.book?.chapters
      .find((ch) => ch.id === args.chapterId)
      ?.sections.find((s) => s.id === args.sectionId)
    const blockIdx = section?.blocks.findIndex((b) => b.id === args.blockId) ?? -1
    const sourceBlock = section?.blocks[blockIdx]
    if (!sourceBlock || blockIdx === -1) return

    const newBlock = await BookService.AddBlock(
      args.bookId,
      args.chapterId,
      args.sectionId,
      sourceBlock.type,
      blockIdx + 1
    )
    if (!newBlock) return

    // Copy content — fire and forget, same pattern as updateBlockAtom
    BookService.UpdateBlock(
      args.bookId, args.chapterId, args.sectionId,
      newBlock.id, sourceBlock.content
    )

    set(booksAtom, (prev) => {
      const prevOb = prev[args.bookId]
      if (!prevOb || !prevOb.book) return prev
      const chapters = prevOb.book.chapters.map((ch) => {
        if (ch.id !== args.chapterId) return ch
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id !== args.sectionId) return sec
            const blocks = [...sec.blocks]
            blocks.splice(blockIdx + 1, 0, { ...newBlock, content: sourceBlock.content })
            return { ...sec, blocks }
          }),
        }
      })
      return {
        ...prev,
        [args.bookId]: {
          ...prevOb,
          book: { ...prevOb.book, chapters },
          dirty: true,
        },
      }
    })
  }
)

// ─── Query execution ─────────────────────────────────────────────────────────

/** In-flight query promises, keyed by blockId. Used for cancellation. */
const inflightQueries = new Map<string, { cancel: () => void }>()

/** Execute a query block against the active connection. */
export const executeBlockAtom = atom(
  null,
  async (
    get,
    set,
    args: { bookId: string; chapterId: string; sectionId: string; blockId: string }
  ) => {
    const { blockId } = args
    console.debug("[executeBlock] called", args)

    // 1. Look up the block content
    const books = get(booksAtom)
    const ob = books[args.bookId]
    console.debug("[executeBlock] book found:", !!ob, "book.id:", ob?.book?.id)

    const block = ob?.book?.chapters
      .find((ch) => ch.id === args.chapterId)
      ?.sections.find((s) => s.id === args.sectionId)
      ?.blocks.find((b) => b.id === blockId)

    // Prefer the live editor content (bypasses the 300ms debounce) over the stored value.
    const liveContent = block ? (get(blockContentRegistryAtom)[blockId]?.() ?? block.content) : undefined
    console.debug("[executeBlock] block found:", !!block, "content:", JSON.stringify(liveContent?.slice(0, 100)))

    if (!block || !liveContent?.trim()) {
      console.debug("[executeBlock] BAIL: no block or empty content")
      set(setCellStateAtom, {
        blockId,
        state: { status: "error", resultId: null, error: "No SQL to execute" },
      })
      return
    }

    // 2. Get active connection — or auto-connect using the tab's selected connection
    let connId = get(activeConnectionIdAtom)
    const tab = get(currentTabAtom)
    const tabEntryId = tab?.type === "book" ? tab.connectionId : null
    const activeEntryId = get(activeEntryIdAtom)

    console.debug("[executeBlock] connId:", connId, "tabEntryId:", tabEntryId, "activeEntryId:", activeEntryId)

    // If no active connection, or tab points to a different entry, auto-connect
    if (!connId || (tabEntryId && tabEntryId !== activeEntryId)) {
      const entryId = tabEntryId
      if (!entryId) {
        console.debug("[executeBlock] BAIL: no connection selected for this tab")
        set(setCellStateAtom, {
          blockId,
          state: { status: "error", resultId: null, error: "No connection selected — pick one in the toolbar" },
        })
        return
      }
      const entry = get(connectionsAtom)[entryId]
      if (!entry) {
        console.debug("[executeBlock] BAIL: connection entry not found:", entryId)
        set(setCellStateAtom, {
          blockId,
          state: { status: "error", resultId: null, error: "Connection entry not found" },
        })
        return
      }
      console.debug("[executeBlock] auto-connecting to:", entry.name)
      try {
        await set(connectAtom, entry)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        set(setCellStateAtom, {
          blockId,
          state: { status: "error", resultId: null, error: `Connection failed: ${msg}` },
        })
        return
      }
      connId = get(activeConnectionIdAtom)
      if (!connId) {
        set(setCellStateAtom, {
          blockId,
          state: { status: "error", resultId: null, error: "Connection established but no ID returned" },
        })
        return
      }
    }

    // 3. Dispose previous result if one exists
    const prevCellState = get(cellStatesAtom)[blockId]
    if (prevCellState?.resultId) {
      console.debug("[executeBlock] disposing previous result:", prevCellState.resultId)
      set(disposeResultAtom, { blockId, resultId: prevCellState.resultId })
    }

    // 4. Set running state
    console.debug("[executeBlock] setting status=running")
    set(setCellStateAtom, {
      blockId,
      state: { status: "running", resultId: null, error: null },
    })

    // 5. Execute
    try {
      console.debug("[executeBlock] calling QueryService.ExecuteQuery(", connId, ",", liveContent!.slice(0, 100), ")")
      const promise = QueryService.ExecuteQuery(connId, liveContent!)
      inflightQueries.set(blockId, promise as unknown as { cancel: () => void })

      const response = await promise
      inflightQueries.delete(blockId)
      console.debug("[executeBlock] response:", response)

      if (!response || !response.meta || !response.page) {
        console.debug("[executeBlock] BAIL: empty response", { response, meta: response?.meta, page: response?.page })
        set(setCellStateAtom, {
          blockId,
          state: { status: "error", resultId: null, error: "Empty response from backend" },
        })
        return
      }

      const blockPageSize = block.pageSize && block.pageSize > 0 ? block.pageSize : 50
      let result = convertQueryResponse(response, blockPageSize)
      // If backend returned a different page size, re-fetch with block's preferred size
      const backendLimit = response.page!.limit
      if (backendLimit > 0 && backendLimit !== blockPageSize) {
        const page = await QueryService.GetResultPage(response.resultId, 0, blockPageSize)
        if (page) {
          result = {
            ...result,
            rows: page.rows ?? [],
            offset: Number(page.offset),
            total: Number(page.total),
            hasMore: page.hasMore,
            pageSize: blockPageSize,
          }
        }
      }
      console.debug("[executeBlock] converted result:", { resultId: result.resultId, rowCount: result.rows.length, cols: result.columns.length })
      set(storeResultAtom, { blockId, result })
      set(setCellStateAtom, {
        blockId,
        state: { status: "success", resultId: response.resultId, error: null },
      })
    } catch (err: unknown) {
      inflightQueries.delete(blockId)
      const message = err instanceof Error ? err.message : String(err)
      console.error("[executeBlock] ERROR:", message, err)
      set(setCellStateAtom, {
        blockId,
        state: { status: "error", resultId: null, error: message },
      })
    }
  }
)

/** Cancel an in-flight query for a block. */
export const cancelQueryAtom = atom(
  null,
  (_get, set, blockId: string) => {
    const inflight = inflightQueries.get(blockId)
    if (inflight && typeof inflight.cancel === "function") {
      inflight.cancel()
      inflightQueries.delete(blockId)
    }
    set(setCellStateAtom, {
      blockId,
      state: { status: "idle", resultId: null, error: null },
    })
  }
)
