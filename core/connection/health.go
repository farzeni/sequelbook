package connection

import (
	"context"
	"time"
)

const (
	healthCheckInterval = 30 * time.Second
	healthCheckTimeout  = 5 * time.Second
)

// startHealthCheck launches a background goroutine that periodically pings
// the connection identified by connID. The goroutine exits when ctx is cancelled,
// which happens via activeConnection.cancelHealth when Disconnect or Close is called.
func (m *Manager) startHealthCheck(ctx context.Context, connID string) {
	go m.healthCheckLoop(ctx, connID)
}

// healthCheckLoop ticks at healthCheckInterval and performs a ping on each tick.
// It exits cleanly when the context is cancelled.
func (m *Manager) healthCheckLoop(ctx context.Context, connID string) {
	ticker := time.NewTicker(healthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.performHealthCheck(ctx, connID)
		}
	}
}

// performHealthCheck pings the active connection and transitions state on failure or recovery.
// It does NOT auto-disconnect on failure — it reports state and lets the user decide.
func (m *Manager) performHealthCheck(ctx context.Context, connID string) {
	m.mu.RLock()
	if m.active == nil || m.active.id != connID {
		m.mu.RUnlock()
		return
	}
	conn := m.active.conn
	prevState := m.active.state
	m.mu.RUnlock()

	pingCtx, cancel := context.WithTimeout(ctx, healthCheckTimeout)
	defer cancel()

	pingErr := conn.Ping(pingCtx)

	if pingErr != nil {
		m.mu.Lock()
		if m.active != nil && m.active.id == connID {
			m.active.state = StateError
			m.active.lastError = pingErr
		}
		m.mu.Unlock()
		m.emitState(connID, StateError, pingErr)
		return
	}

	// Recovery: ping succeeded after a previous error.
	if prevState == StateError {
		m.mu.Lock()
		if m.active != nil && m.active.id == connID {
			m.active.state = StateConnected
			m.active.lastError = nil
		}
		m.mu.Unlock()
		m.emitState(connID, StateConnected, nil)
	}
}
