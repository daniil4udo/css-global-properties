css-global-properties / [Exports](modules.md)

![](https://img.shields.io/badge/Javascript-ES6-orange.svg)
![](https://img.shields.io/badge/CSS-Custom_Properties-blue.svg)

# CSS Variables Manipulation with JS (ES6)

CSSGlobalProperties provides a natural interface for fast manipulation of **GLOBAL [CSS Variables/Custom Properties](https://www.w3.org/TR/css-variables-1/)** (those declared with a `:root` selector), simplifying template's tasks, and manipulation of general CSS styles in javascript.

```javascript
import { CSSGlobalProperties } from 'css-global-properties';

// set the CSS global variable --myColor value to "green"
let cssVar = CSSGlobalProperties();
cssVar.myColor = "green";
```

List of all function you can find  [HERE](../docs/modules.md)

<!-- Demo: [See it in action](https://daniil4udo.github.io/css-global-properties/examples/demo-simple.html) -->

# Syntax

```javascript
 CSSGlobalProperties( [ configObject ] )
```

## Parameters

A Config Object can be provided to customize internal behavior. It can set any of the following properties:

* **`autoprefix`**:
When set to `true` allows access to the CSS variables names without specifying the `--` prefix on the name. (Boolean. Default:`true`)

* **`filter`**:
Allows to filter which Style Elements should be scanned or ignored through CSS selector strings. By default everything is scanned. (String. Default: `'*'`)

* **`normalize`**:
A user-provided transform-function that processes the CSS variable names (before they get autoPrefixed). The function must return a String. This mechanism allows the usage of custom variable name formatting (eg. camelCase, snake_case, CONSTANT_CASE) in your code. (A nice source of transform functions is [change-case](https://www.npmjs.com/package/change-case)). (Function. Default: `none`)

## Return Value

The CSSGlobalProperties() Constructor returns a `Proxy Object` containing a **live Collection** with the found CSS global variables.

# Installation

You can choose between any of the following available distribution channels:

* **GIT**: Clone the repository locally using git (or download the latest release [here](https://github.com/daniil4udo/css-global-properties/releases/latest))

 ```bash
 git clone https://github.com/daniil4udo/css-global-properties.git
```

* **NPM**: Install it using npm and import it.

 ```bash
npm install css-global-properties -s
```

* **CDN**: Include the script in your HTML header (`window.CSSGlobalProperties` will be created).

 ```html
<script src="https://daniil4udo.info/css-global-properties/src/main.js"></script>
```

# Usage

The `Constructor` returns a `Proxy Object` and any regular Object operation can be performed on it (except property deletion). In the following list, you will find examples of the the most common operations and interactions:

**Import and Construct**:

```javascript
import { CSSGlobalProperties } from 'css-global-properties';
let cssVar = CSSGlobalProperties();
```

**Set** a new value to a CSS global variable:

```javascript
/* The following assignments to '--myVariable' behave equally, and are all valid */
cssVar.myVariable = 'newValue';
cssVar['myVariable'] = 'newValue';
cssVar['--myVariable'] = 'newValue';
```

**Get** the value of a CSS global variable:

```javascript
/* The following value retrievals for '--myVariable' behave equally, and are all valid */
console.log( cssVar.myVariable );
console.log( cssVar['myVariable'] );
console.log( cssVar['--myVariable'] );
```

**Enumeration** of all declared CSS global variables, through iteration:

```javascript
for( let v in cssVar ){
    console.log( v , '=', cssVar[v] );
}
```

# Variable Name Normalization

`Normalize functions` (implemented by [@SebastianDuval](https://github.com/SebastianDuval) ) allow you to perform automatic transformations of the variable names, to make them more suitable for the javascript syntax, or to simply adapt them to your coding style and personal preferences.

In the following example a CSS variable declared using hyphens (`--my-css-variable`), can be accessed in Javascript using the widely used camelCase style (`myCssVariable`), thanks to the `camelToHyphens` normalize function (and the native `autoprefixer`):

CSS:

```html
<style>
   :root{
        --my-css-variable: 'red';
    }
</style>
```

Javascript:

```javascript
let camelToHyphens = function(name){
    return name.replace(/[A-Z]/g, m => "-" + m.toLowerCase() );
}
let cssVar = CSSGlobalProperties( { normalize:camelToHyphens });

cssVar.myCssVariable = 'blue';
```

# Automatic DOM Change Tracking

The library uses a DOM Mutation Observer to detect new inclusion in the document. Thanks to this observer, new CSS variables are available automatically when new styles are attached to the document.  

# CORS Restrictions

CSSGlobalVariables will face limitations when trying to extract the CSS definitions of a remote stylesheet (except for same-origin urls). Restrictions applied by the browser, based in the Cross Origin Policy will block any access attempt.

In such a scenario, a warning will be printed in the console, and the affected style element will be flagged and ignored by the library.

To prevent this restriction, add the `crossorigin` attribute to the `<link>` element:

```html
<link rel="stylesheet" crossorigin="anonymous" href="https://www.a-remote-server/styles.css">
```

If the server is configured to allow CORS (through the  **Access-Control-Allow-Origin** directive) the CORS restrictions should disappear.
