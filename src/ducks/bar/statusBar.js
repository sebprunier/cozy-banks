/* global cordova */

// TODO Move this module to cozy-ui

import { getCssVariableValue } from 'cozy-ui/react/utils/color'

export const luminosity = hex => {
  if (hex.length == 4) {
    const r = hex.slice(1, 2)
    const g = hex.slice(2, 3)
    const b = hex.slice(3, 4)
    hex = `#${r}${r}${g}${g}${b}${b}`
  }
  const R = parseInt(hex.slice(1, 3), 16)
  const G = parseInt(hex.slice(3, 5), 16)
  const B = parseInt(hex.slice(5, 7), 16)
  return 0.21 * R + 0.72 * G + 0.07 * B
}

// Luminosity goes from 0 to 255. At the middle point, we switch
// the bar theme
const lumThresold = 127

export const setColor = colorHex => {
  if (!window.StatusBar) {
    return
  }
  const StatusBar = window.StatusBar
  const lum = luminosity(colorHex)
  if (lum > lumThresold) {
    StatusBar.styleDefault()
  } else {
    StatusBar.styleBlackTranslucent()
  }
  StatusBar.backgroundColorByHexString(colorHex)
}

const THEME_TO_COLORS = {
  primary: 'statusBarPrimaryColor',
  default: 'statusBarDefault'
}

export const setTheme = theme => {
  const colorName = THEME_TO_COLORS[theme] || THEME_TO_COLORS.default
  const platform = cordova.platformId == 'ios' ? 'IOS' : 'Android'
  const varName = colorName + platform
  const colorValue = getCssVariableValue(varName)
  setColor(colorValue)
}
