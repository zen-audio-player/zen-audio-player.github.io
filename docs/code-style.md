# Code Style Guide

This document summarizes the coding conventions and style rules used in the project. It is aligned with the rules defined in the .eslintrc.json file and with the guidelines from eslint.org

## 1. Code Style

### Brace Style
- **Rule:** brace-style
- **Severity:** Error
- **Description:** Opening brace `{` goes on the same line as the statement.  
  Closing brace `}` goes on the next line.  
  For `else`, `catch`, or `finally`, the opening brace is on the next line.
- **Correct:**
if (condition) {
    doSomething();
}
else {
    doSomethingElse();
}

### Padded Blocks
- **Rule:** padded-blocks
- **Severity:** Error
- **Description:** No empty lines inside blocks
- **Correct:**
function test() {
    console.log("Hello");
}
- **Incorrect:**
function test() {

    console.log("Hello");

}

### No Spaced Function Calls
- **Rule:** no-spaced-func
- **Severity:** Error
- **Description:** Do not add spaces between function name and parentheses
- **Correct:** `myFunction()`
- **Incorrect:** `myFunction ()`

### No Duplicate Function Arguments
- **Rule:** no-dupe-args
- **Severity:** Error
- **Description:** Function arguments must be unique
- **Correct:** `function sum(a, b) { }`
- **Incorrect:** `function sum(a, a) { }`

### No Tabs
- **Rule:** no-tabs
- **Severity:** Error
- **Description:** Use spaces instead of tabs
- **Correct:** 4 spaces per indentation
- **Incorrect:** `\t` (tab character)

### Indentation
- **Rule:** indent
- **Switch Cases:** indent 1 level inside `switch`
- **Severity:** Error
- **Description:** 4 spaces per level
- **Correct:**
function test() {
    if (true) {
        console.log("Hello");
    }

    switch(value) {
        case 1:
            doSomething();
            break;
        default:
            doSomethingElse();
    }
}

### Curly Braces
- **Rule:** curly
- **Severity:** Error
- **Description:** Always use braces `{}` for all blocks, even single-line

### Linebreak Style
- **Rule:** linebreak-style
- **Severity:** Off
- **Description:** No enforced linebreak style
- **Note:** Both LF (Unix) and CRLF (Windows) are allowed.

### CamelCase
- **Rule:** camelcase
- **Severity:** Error
- **Description:** Use camelCase for all variable names and object properties

### Quotes
- **Rule:** quotes
- **Severity:** Error
- **Description:** Use double quotes for strings. Avoid single quotes unless required by the code context.

### No Trailing Spaces
- **Rule:** no-trailing-spaces
- **Severity:** Error
- **Description:** Do not leave whitespace at the end of lines.

### Semicolons
- **Rule:** semi
- **Severity:** Error
- **Description:** Require semicolons at the end of every statement for consistency and to prevent automatic semicolon insertion issues.

### Space Around Operators
- **Rule:** space-infix-ops
- **Severity:** Error
- **Description:** Require spaces around infix operators (e.g., `a + b`, `x === y`) for readability.

### Keyword Spacing
- **Rule:** keyword-spacing
- **Severity:** Error
- **Description:** Require spaces before and after keywords (e.g., `if (condition) {}`, `return value;`) for readability.

### Comma Spacing
- **Rule:** comma-spacing
- **Severity:** Error
- **Description:** Require a space after commas in lists, function parameters, and object properties for readability.

### No Extra Semicolons
- **Rule:** no-extra-semi
- **Severity:** Error
- **Description:** Disallow unnecessary semicolons that do not affect program behavior.

### Semicolon Spacing
- **Rule:** semi-spacing
- **Severity:** Error
- **Description:** Disallow spaces before semicolons and ensure proper spacing after for readability.

### Object Key Spacing
- **Rule:** key-spacing
- **Severity:** Error
- **Description:** Enforce consistent spacing around the colon in object literals (no space before `:`, one space after `:`).

### No Irregular Whitespace
- **Rule:** no-irregular-whitespace
- **Severity:** Error
- **Description:** Disallow irregular or invisible whitespace characters to prevent subtle bugs and maintain code clarity.

### Spaced Comments
- **Rule:** spaced-comment
- **Severity:** Error
- **Description:** Require a space after `//` or `/*` in comments to improve readability.

## 2. Best Practices

### No Functions Inside Loops
- **Rule:** no-loop-func
- **Severity:** Error
- **Description:** Do not declare functions inside loops
- **Reason:** Functions created within loops can capture the wrong variable due to scope issues or degrade performance.

### No Unused Expressions
- **Rule:** no-unused-expressions
- **Severity:** Error
- **Description:** Disallow expressions that do not affect the program (e.g., standalone or logical expressions with no side effects).

## 3. Warnings e Exceptions

### No Console
- **Rule:** no-console
- **Severity:** Warning
- **Description:** Warn when using `console` statements (e.g., `console.log`), to discourage debugging logs in production code.

### Space Before Blocks
- **Rule:** space-before-blocks
- **Severity:** Error
- **Description:** Require a space before opening braces `{` in statements and functions for readability.

### Strict Equality
- **Rule:** eqeqeq
- **Severity:** Error
- **Description:** Use `===` and `!==` instead of `==` and `!=` to ensure type-safe comparisons.