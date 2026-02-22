package result

import (
	"container/list"
	"sync"
)

type lruEntry struct {
	key   string
	value *storedResult
}

type lruCache struct {
	cap   int
	mu    sync.Mutex
	items map[string]*list.Element // list.Element.Value is *lruEntry
	list  *list.List               // front = MRU, back = LRU
}

func newLRUCache(cap int) *lruCache {
	return &lruCache{
		cap:   cap,
		items: make(map[string]*list.Element),
		list:  list.New(),
	}
}

// get returns the value and moves the entry to MRU position.
func (c *lruCache) get(key string) (*storedResult, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	el, ok := c.items[key]
	if !ok {
		return nil, false
	}
	c.list.MoveToFront(el)
	return el.Value.(*lruEntry).value, true
}

// put inserts or updates a key. Returns evicted *storedResult (nil if none evicted).
// Eviction happens when len == cap before insertion.
func (c *lruCache) put(key string, value *storedResult) *storedResult {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Update existing entry.
	if el, ok := c.items[key]; ok {
		c.list.MoveToFront(el)
		el.Value.(*lruEntry).value = value
		return nil
	}

	// Evict LRU if at capacity.
	var evicted *storedResult
	if len(c.items) >= c.cap {
		back := c.list.Back()
		if back != nil {
			entry := back.Value.(*lruEntry)
			evicted = entry.value
			delete(c.items, entry.key)
			c.list.Remove(back)
		}
	}

	el := c.list.PushFront(&lruEntry{key: key, value: value})
	c.items[key] = el
	return evicted
}

// delete removes a key. Returns true if found.
func (c *lruCache) delete(key string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	el, ok := c.items[key]
	if !ok {
		return false
	}
	delete(c.items, key)
	c.list.Remove(el)
	return true
}

// len returns the current number of entries.
func (c *lruCache) len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.items)
}
