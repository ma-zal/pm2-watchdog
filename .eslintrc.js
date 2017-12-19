module.exports = {
    "extends": [
        "eslint:recommended",
        "./node_modules/eslint-config-google/index.js",
    ],
    "parserOptions": {
        "impliedStrict": true,
        "ecmaVersion": 8,
        "sourceType": "module",
        "module": "amd",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "env": {
        node: true,
        es6: true,
    },
    "rules": {
       "no-console": ["off"],
        "padded-blocks": "off", // If On, blocks must be padded by blank lines.
        "block-spacing": ["error", "always"], // At one-line blocks, the space must exists after/before { and }.
        "spaced-comment": "off", // If On, commens have start with space (but IntelliJ's type definition style is without spaces)
        "max-len": ["off"],
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "no-multi-spaces": ["error", { "ignoreEOLComments": true }],
        "semi": ["error", "always"],
        "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
        // "no-multi-spaces": ["error", {"ignoreEOLComments":true, "exceptions": { "Property": true }}],
    },
    // "globals": {
        // "Promise": false
    // }

};
