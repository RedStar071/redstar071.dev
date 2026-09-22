export default defineAppConfig({
  global: {
    name: "RedStar",
    username: "redstar071",
    avatar: "https://avatars.githubusercontent.com/u/76824516?v=4",
    location: "Italy",
    email: "redstar071@proton.me",
    discordId: "605162125027049472"
  },
  socials: [{
    label: "GitHub",
    handle: "RedStar071",
    icon: "i-simple-icons-github",
    to: "https://github.com/RedStar071"
  }, {
    label: "Discord",
    handle: "redstar071",
    icon: "i-simple-icons-discord",
    to: "https://discord.com/users/605162125027049472"
  }, {
    label: "X",
    handle: "@redstar071",
    icon: "i-simple-icons-x",
    to: "https://x.com/redstar071"
  }, {
    label: "Bluesky",
    handle: "redstar071.dev",
    icon: "i-simple-icons-bluesky",
    to: "https://bsky.app/profile/redstar071.dev"
  }, {
    label: "Telegram",
    handle: "redstar071",
    icon: "i-simple-icons-telegram",
    to: "https://t.me/redstar071"
  }, {
    label: "Instagram",
    handle: "redstar071",
    icon: "i-simple-icons-instagram",
    to: "https://instagram.com/redstar071"
  }, {
    label: "GitHub Sponsors",
    handle: "sponsor my work",
    icon: "i-simple-icons-githubsponsors",
    to: "https://github.com/sponsors/RedStar071"
  }],
  ui: {
    colors: {
      primary: "red",
      neutral: "night"
    },
    icons: {
      arrowDown: "i-material-symbols-arrow-downward-rounded",
      arrowLeft: "i-material-symbols-arrow-back-rounded",
      arrowRight: "i-material-symbols-arrow-forward-rounded",
      arrowUp: "i-material-symbols-arrow-upward-rounded",
      caution: "i-material-symbols-error-outline-rounded",
      check: "i-material-symbols-check-rounded",
      chevronDoubleLeft: "i-material-symbols-keyboard-double-arrow-left-rounded",
      chevronDoubleRight: "i-material-symbols-keyboard-double-arrow-right-rounded",
      chevronDown: "i-material-symbols-keyboard-arrow-down-rounded",
      chevronLeft: "i-material-symbols-chevron-left-rounded",
      chevronRight: "i-material-symbols-chevron-right-rounded",
      chevronUp: "i-material-symbols-expand-less-rounded",
      close: "i-material-symbols-close-rounded",
      copy: "i-material-symbols-content-copy-outline-rounded",
      copyCheck: "i-material-symbols-check-rounded",
      dark: "i-material-symbols-dark-mode-outline-rounded",
      ellipsis: "i-material-symbols-more-horiz",
      error: "i-material-symbols-error-outline-rounded",
      external: "i-material-symbols-arrow-outward-rounded",
      eye: "i-material-symbols-visibility-outline-rounded",
      eyeOff: "i-material-symbols-visibility-off-outline-rounded",
      file: "i-material-symbols-description-outline-rounded",
      folder: "i-material-symbols-folder-outline-rounded",
      folderOpen: "i-material-symbols-folder-open-outline-rounded",
      hash: "i-material-symbols-tag-rounded",
      info: "i-material-symbols-info-outline-rounded",
      light: "material-symbols:light-mode-outline-rounded",
      loading: "i-material-symbols-progress-activity",
      menu: "i-material-symbols-menu-rounded",
      minus: "i-material-symbols-remove-rounded",
      panelClose: "i-material-symbols-dock-to-left-outline-rounded",
      panelOpen: "i-material-symbols-dock-to-right-outline-rounded",
      plus: "i-material-symbols-add-rounded",
      reload: "i-material-symbols-refresh-rounded",
      search: "i-material-symbols-search-rounded",
      stop: "i-material-symbols-stop-rounded",
      success: "i-material-symbols-check-circle-outline-rounded",
      system: "i-material-symbols-computer-outline-rounded",
      tip: "material-symbols:lightbulb-outline-rounded",
      upload: "i-material-symbols-upload-rounded",
      warning: "i-material-symbols-warning-outline-rounded"
    },
    button: {
      slots: {
        base: "rounded-full transition-[background-color,color,border-radius,scale] duration-200 ease-(--ease-effects) active:scale-[0.97] active:rounded-md"
      },
      compoundVariants: [{
        // Dark mode keeps red-400 for primary text, but filled surfaces use the full brand red (red-500 ≈ #FD171B).
        color: "primary",
        variant: "solid",
        class: "dark:bg-primary-500 dark:hover:bg-primary-500/80 dark:active:bg-primary-500/80 dark:disabled:bg-primary-500 dark:aria-disabled:bg-primary-500"
      }]
    },
    tooltip: {
      slots: {
        content: "rounded-sm font-mono"
      }
    }
  }
});
