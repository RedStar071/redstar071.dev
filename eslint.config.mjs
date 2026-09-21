// @ts-check
import antfu from "@antfu/eslint-config";
import packageJson from "eslint-plugin-package-json";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  antfu(
    {
      vue: {
        a11y: true
      },
      stylistic: {
        indent: 2,
        quotes: "double",
        semi: true,
        jsx: true
      },
      rules: {
        "style/comma-dangle": ["error", "never"],
        "style/brace-style": ["error", "1tbs", { allowSingleLine: true }]
      }
    }
  )
).append({
  ...packageJson.configs.recommended,
  files: ["package.json"],
  name: "antfu/json/package",
  rules: {
    "jsonc/sort-keys": "off",
    "jsonc/indent": "off"
  }
}).append({
  files: ["**/*.vue"],
  name: "antfu/vue/recommended",
  rules: {
    "vue/block-order": [
      "error",
      {
        order: [
          "template",
          "script:not([setup])",
          "script[setup]",
          "style:not([scoped])",
          "style[scoped]"
        ]
      }
    ],
    "vue/html-self-closing": [
      "warn",
      {
        html: {
          void: "always",
          normal: "never"
        }
      }
    ],
    "vue/camelcase": "error",
    "vue/max-attributes-per-line": [
      "error",
      {
        singleline: { max: 10 },
        multiline: { max: 1 }
      }
    ],
    "vue/custom-event-name-casing": "off",
    "vue/no-multiple-template-root": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/no-restricted-syntax": [
      "error",
      {
        selector: "VElement[name='a']",
        message: "Use NuxtLink instead."
      }
    ],
    "import/first": "off",
    "import/consistent-type-specifier-style": "off"
  }
});
