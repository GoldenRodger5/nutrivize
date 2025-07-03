// Timezone utility functions

/**
 * Get the current date in a specific timezone as YYYY-MM-DD format
 */
export const getCurrentDateInTimezone = (timezone: string = 'America/New_York'): string => {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatter.format(now)
  } catch (error) {
    console.error('Error formatting date with timezone:', error)
    // Fallback to UTC date
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Get current datetime in timezone as ISO string
 */
export const getCurrentDateTimeInTimezone = (timezone: string = 'America/New_York'): string => {
  try {
    const now = new Date()
    // Create a date in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(now)
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value
    const second = parts.find(p => p.type === 'second')?.value
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`
  } catch (error) {
    console.error('Error formatting datetime with timezone:', error)
    return new Date().toISOString()
  }
}

/**
 * Format a date string for display in a specific timezone
 */
export const formatDateInTimezone = (
  dateString: string, 
  timezone: string = 'America/New_York',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const date = new Date(dateString)
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Get user's timezone from settings, with fallback to browser detection
 */
export const getUserTimezone = (): string => {
  try {
    // Try to get from localStorage (user settings)
    const savedPrefs = localStorage.getItem('nutritionPrefs')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      if (prefs.timezone) {
        return prefs.timezone
      }
    }
  } catch (error) {
    console.error('Error reading timezone from settings:', error)
  }
  
  // Fallback to browser timezone detection
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Error detecting browser timezone:', error)
    return 'America/New_York' // Ultimate fallback
  }
}

/**
 * Save timezone preference to localStorage
 */
export const saveTimezonePreference = (timezone: string): void => {
  try {
    const existingPrefs = localStorage.getItem('nutritionPrefs')
    const prefs = existingPrefs ? JSON.parse(existingPrefs) : {}
    prefs.timezone = timezone
    localStorage.setItem('nutritionPrefs', JSON.stringify(prefs))
  } catch (error) {
    console.error('Error saving timezone preference:', error)
  }
}

/**
 * Check if a given date string is today in the user's timezone
 */
export const isToday = (dateString: string, timezone?: string): boolean => {
  try {
    const userTimezone = timezone || getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    return dateString === today
  } catch (error) {
    console.error('Error checking if date is today:', error)
    return false
  }
}

/**
 * Get a timezone-aware Date object for today at noon (to avoid timezone edge cases)
 */
export const getTodayDateObject = (timezone?: string): Date => {
  try {
    const userTimezone = timezone || getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    return new Date(today + 'T12:00:00') // Use noon to avoid timezone issues
  } catch (error) {
    console.error('Error creating today date object:', error)
    return new Date() // Fallback to browser date
  }
}

/**
 * Check if two date strings represent the same day
 */
export const isSameDay = (date1: string, date2: string): boolean => {
  try {
    return date1.split('T')[0] === date2.split('T')[0]
  } catch (error) {
    console.error('Error comparing dates:', error)
    return false
  }
}
