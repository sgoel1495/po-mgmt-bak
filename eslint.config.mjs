import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    "rules": {
      "indent": [
        "error",
        4,
        {
          "SwitchCase": 1
        }
      ],
      "quotes": [
        "error",
        "double"
      ],
      "semi": [
        "error",
        "always"
      ],
      "no-unused-vars": [
        "error",
        {
          "vars": "all",
          "argsIgnorePattern": "^_"
        }
      ],
      "comma-spacing": [
        "error",
        {
          "before": false,
          "after": true
        }
      ],
      "array-bracket-spacing": [
        "error",
        "never"
      ],
      "arrow-parens": [
        "error",
        "always"
      ],
      "arrow-spacing": "error",
      "block-spacing": "error",
      "brace-style": "error",
      "comma-style": [
        "error",
        "last"
      ],
      "computed-property-spacing": [
        "error",
        "never"
      ],
      "key-spacing": [
        "error",
        {
          "beforeColon": false,
          "afterColon": true,
          "mode": "strict"
        }
      ],
      "object-curly-spacing": [
        "error",
        "never"
      ],
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-useless-escape": "off"
    }
  }
];