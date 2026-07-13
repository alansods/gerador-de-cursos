import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  const locale = (localeCookie?.value as Locale) || defaultLocale

  // Import all namespace files and wrap them in their namespace keys
  const messages = {
    common: (await import(`./locales/${locale}/common.json`)).default,
    auth: (await import(`./locales/${locale}/auth.json`)).default,
    courses: (await import(`./locales/${locale}/courses.json`)).default,
    home: (await import(`./locales/${locale}/home.json`)).default,
    users: (await import(`./locales/${locale}/users.json`)).default,
    scorm: (await import(`./locales/${locale}/scorm.json`)).default,
    errors: (await import(`./locales/${locale}/errors.json`)).default,
  }

  return {
    locale,
    messages,
  }
})
