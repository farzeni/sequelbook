package events

import "github.com/wailsapp/wails/v3/pkg/application"

func init() {
	application.RegisterEvent[ConnectionStateChangedPayload](ConnectionStateChanged)
	application.RegisterEvent[QueryStartedPayload](QueryStarted)
	application.RegisterEvent[QueryCompletedPayload](QueryCompleted)
	application.RegisterEvent[QueryFailedPayload](QueryFailed)
	application.RegisterEvent[QueryCancelledPayload](QueryCancelled)
	application.RegisterEvent[NotificationPayload](Notification)
}
