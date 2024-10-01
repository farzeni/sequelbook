import { BookTab, Tab } from "./types"

export function isBookTab(tab: Tab): tab is BookTab {
  return tab.type === "book"
}
export function isBookID(tabId: string): boolean {
  return tabId.startsWith("bok")
}
