import type { NavigationMenuItem } from '@nuxt/ui'

export const navLinks: NavigationMenuItem[] = [{
  label: 'home',
  icon: 'i-material-symbols-home-outline-rounded',
  to: '/'
}, {
  label: 'projects',
  icon: 'i-material-symbols-deployed-code-outline-rounded',
  to: '/projects'
}, {
  label: 'writing',
  icon: 'i-material-symbols-ink-pen-outline-rounded',
  to: '/blog'
}]
