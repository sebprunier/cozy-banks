import { hashHistory } from 'react-router'
import { getSettings, isNotificationEnabled } from 'ducks/settings/helpers'

let push

export const registerPushNotifications = async (cozyClient, clientInfos) => {
  const settings = await getSettings(cozyClient)

  return startPushNotifications(cozyClient, settings, clientInfos)
}

export const startPushNotifications = (cozyClient, settings, clientInfos) => {
  if (push || !isNotificationEnabled(settings)) {
    return
  }

  /**
   * When we receive a notification while the app is in foreground, all on('notification')
   * handlers are executed. But we don't want to redirect the user without his consent.
   * So we redirect only when the user taps on the notification in the notification center.
   * In this case, the app is always in background.
   */
  const handleNotification = notification => {
    if (
      !notification.additionalData.foreground &&
      notification.additionalData.route
    ) {
      hashHistory.push(notification.additionalData.route)
    }
  }

  push = window.PushNotification.init({
    android: {
      forceShow: true,
      clearNotifications: false
    },
    ios: {
      alert: 'true',
      badge: 'true',
      sound: 'true'
    }
  })

  push.on('notification', handleNotification)
  // eslint-disable-next-line no-console
  push.on('error', err => console.log(err))
  push.on('registration', async ({ registrationId }) => {
    cozyClient.client.updateInformation({
      ...clientInfos,
      notificationDeviceToken: registrationId
    })
  })
}

export const stopPushNotifications = () => {
  if (push) {
    push.unregister(
      () => {
        push = null
      },
      error => {
        throw new Error('error while unregistering notifications: ' + error)
      }
    )
  }
}
