[css-global-properties](README.md) / Exports

# css-global-properties

## Table of contents

### Interfaces

- [CSSGlobalPropertiesOptions](interfaces/CSSGlobalPropertiesOptions.md)

### Functions

- [CSSGlobalProperties](modules.md#cssglobalproperties)
- [addCSSRoot](modules.md#addcssroot)
- [createHeadStyleTag](modules.md#createheadstyletag)
- [createNormalizer](modules.md#createnormalizer)
- [cssRulesEntries](modules.md#cssrulesentries)
- [isAllowedTagName](modules.md#isallowedtagname)
- [testCrossOrigin](modules.md#testcrossorigin)
- [useRootStyle](modules.md#userootstyle)

## Functions

### CSSGlobalProperties

▸ **CSSGlobalProperties**<`CSSProp`\>(`opts?`): `Object`

Creates an object to interact with global CSS properties.
This function provides a mechanism to live-get and set CSS variables and their values.
The returned object provides a proxy to directly interact with CSS variables
and a `stop` method to cease interactions and clean up observers.

This function is a friendly fork of [css-global-variables](https://github.com/colxi/css-global-variables).

**Note:** This function is intended to be used in a browser environment only.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CSSProp` | extends `string` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `opts?` | [`CSSGlobalPropertiesOptions`](interfaces/CSSGlobalPropertiesOptions.md) | Configuration options for `CSSGlobalProperties`. |

#### Returns

`Object`

An object with two properties:
- `proxy`: Proxy object containing the CSS variables and their values. Provides bound methods for live-getting and setting of the variables and values.
- `isStopped`: Function that checks if Proxy has been revoked and observer disconnected.
- `stop`: Function that, when invoked, disconnects the observer and revokes the proxy.

| Name | Type |
| :------ | :------ |
| `isStopped` | () => `boolean` |
| `proxy` | `Record`<`CSSProp` \| \`--${CSSProp}\`, `string`\> |
| `stop` | () => `void` |

**`Throws`**

Throws an error if the function is not executed in a browser environment.

**`Throws`**

Throws a type error if the provided configuration is invalid.

**`Example`**

```ts
const cssProps = CSSGlobalProperties();
cssProps.proxy['--my-var'] = 'blue';
console.log(cssProps.proxy['--my-var']); // 'blue'
cssProps.stop();
```

#### Defined in

[CSSGlobalProperties.ts:58](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/CSSGlobalProperties.ts#L58)

___

### addCSSRoot

▸ **addCSSRoot**(`sheet`, `opts?`): `number`

Inserts a new CSS rule into the specified stylesheet using CSSOM

Adds a CSS rule to an existing `<style>` sheet element by using the CSSStyleSheet's `insertRule` method.
The rule is inserted at a specific index in the stylesheet or appended at the end if no index is provided.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sheet` | `CSSStyleSheet` | The `<style>` element containing the CSS rules. |
| `opts` | `Object` | An optional object containing the rule options. |
| `opts.rules?` | `string` | The CSS rules to apply to the selector, written as a string. |

#### Returns

`number`

**`Remarks`**

- Make sure the `sheet` parameter is a valid `<style>` element that has been added to the DOM.
- The function does nothing if the `sheet` or its `sheet` property is `null`.

**`Example`**

```typescript
const styleSheet = createRootStyle(); // Assume createRootStyle creates and returns a <style> element
addCSSRoot(styleSheet, { selector: '.my-class', rules: 'background-color: red; color: white;' });
```

#### Defined in

[styleHelpers.ts:127](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L127)

___

### createHeadStyleTag

▸ **createHeadStyleTag**(`options?`): `Object`

Creates and appends a `<style>` element to the document's head.

This function creates a `<style>` element, sets its media type, optionally sets its ID, and then appends it to the `<head>` of the document.
It's particularly useful for dynamic stylesheet injection. A WebKit hack is applied to the `<style>` tag for compatibility.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `Object` | An optional configuration object |
| `options.id?` | `string` | The ID to set for the `<style>` element. If not specified, a random ID will be generated |
| `options.media?` | `string` | The media type of the `<style>` tag (default is `'all'`) |

#### Returns

`Object`

The created and appended `<style>` element

| Name | Type |
| :------ | :------ |
| `remove` | () => `HTMLStyleElement` |
| `style` | `HTMLStyleElement` |

**`Remarks`**

- The created `<style>` element is returned for further manipulation.
- The ID of the `<style>` element is generated using `window.crypto.randomUUID()` if not provided.

**`Example`**

```typescript
const styleElement = createRootStyle({ media: 'print', id: 'print-styles' });
```

#### Defined in

[styleHelpers.ts:84](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L84)

___

### createNormalizer

▸ **createNormalizer**(`options?`): `Memoized`<(`name`: `string` \| `symbol`) => `string`\>

Creates a function to normalize CSS variable names.

This function takes an options object with `normalize` and `autoprefix` properties. It returns a function that
normalizes the name of a CSS variable based on these options. The returned function also utilizes caching to
avoid redundant computations.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`CSSGlobalPropertiesOptions`](interfaces/CSSGlobalPropertiesOptions.md) | Configuration options. |

#### Returns

`Memoized`<(`name`: `string` \| `symbol`) => `string`\>

A function that takes a CSS variable name (string or symbol) and returns a normalized name.

**`Remarks`**

- If `normalize` is provided, it will be executed on the CSS variable name.
- If `autoprefix` is set to `true`, the CSS variable name will be prefixed with `--` if it doesn't already start with `--`.
- If `autoprefix` is set to `false`, an error will be thrown if the CSS variable name doesn't start with `--`.

**`Example`**

```typescript
const normalizer = createNormalizer({ normalize: name => name.toUpperCase(), autoprefix: true });
const normalized = normalizer('my-var'); // Output: '--MY-VAR'
```

#### Defined in

[styleHelpers.ts:303](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L303)

___

### cssRulesEntries

▸ **cssRulesEntries**(`rules`, `options`): `CSSRuleEntries`

Extracts CSS custom properties (variables) from a list of CSS rules based on a specified selector.

This function iterates through an array of CSS rules and collects the CSS custom properties defined
in rules that match the provided selector. The extracted properties are returned as an array of key-value pairs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `rules` | `CSSRuleList` \| `CSSRule`[] | An array of `CSSRule` objects to search through. |
| `options` | [`CSSGlobalPropertiesOptions`](interfaces/CSSGlobalPropertiesOptions.md) | Configuration options. |

#### Returns

`CSSRuleEntries`

An array of key-value pairs representing the CSS custom properties and their values.

**`Remarks`**

- The function specifically looks for CSS custom properties, which are variables prefixed with `--`.
- Only CSS rules of type `CSSStyleRule` are considered.

**`Example`**

```typescript
const myRules = document.styleSheets[0].cssRules;
const options = { selector: ':root' };
const entries = cssRulesEntries(myRules as any[], options);
```

#### Defined in

[styleHelpers.ts:245](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L245)

___

### isAllowedTagName

▸ **isAllowedTagName**(`node`, `allowedTagNames?`): `boolean`

Checks if a given DOM node's tag name is among a list of allowed tag names.

This function takes a DOM `Node` and an optional array of allowed tag names (defaulting to 'STYLE' and 'LINK'),
and returns a boolean indicating whether the node's tag name is among those that are allowed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | `Node` | The DOM node to check. |
| `allowedTagNames` | `string`[] | An optional array of allowed tag names (default is `['STYLE', 'LINK']`). |

#### Returns

`boolean`

A boolean indicating whether the `node`'s tag name is among the `allowedTagNames`.

**`Remarks`**

- The function performs a case-insensitive check.
- If the node does not have a `tagName` property, the function will return `false`.

**`Example`**

```typescript
const element = document.createElement('style');
const isAllowed = isAllowedTagName(element); // Returns true
```

**`Example`**

```typescript
const textNode = document.createTextNode('Hello');
const isAllowed = isAllowedTagName(textNode); // Returns false
```

#### Defined in

[styleHelpers.ts:158](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L158)

___

### testCrossOrigin

▸ **testCrossOrigin**(`styleSheet`, `options`): `boolean` \| { `error`: `Error` ; `reason?`: ``"cors"``  }

Tests the cross-origin status of a given CSS stylesheet.

This function attempts to access the `cssRules` property of a `CSSStyleSheet` object to detect if it's a
cross-origin stylesheet. If it's cross-origin and causes an exception, further processing is performed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `styleSheet` | `CSSStyleSheet` | The stylesheet to test. |
| `options` | [`CSSGlobalPropertiesOptions`](interfaces/CSSGlobalPropertiesOptions.md) | Configuration options. |

#### Returns

`boolean` \| { `error`: `Error` ; `reason?`: ``"cors"``  }

Either `false` if no error, or an object describing the error.

**`Remarks`**

- This function should only be used for stylesheets that have been fully loaded.
- If a CORS (Cross-Origin Resource Sharing) error is detected, the `ignoreAttrTag` attribute will be set on the
  stylesheet's owner node, unless the attribute already exists.
- If the function is able to successfully access `cssRules`, it returns `false`.
- If a CORS error occurs, it returns an object with a `reason` key set to `'cors'` and an `error` key containing
  the caught error.
- If another type of error occurs, it returns an object with just the `error` key.

**`Example`**

```typescript
const mySheet = document.styleSheets[0] as CSSStyleSheet;
const result = testCrossOrigin(mySheet, { ignoreAttrTag: 'data-ignore-cors' });
```

#### Defined in

[styleHelpers.ts:195](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L195)

___

### useRootStyle

▸ **useRootStyle**(`opts`): `Object`

Creates and returns an object containing a dynamically created <style> tag,
a setProperty function, and a remove function.

- The `style` member contains the dynamically created <style> tag.
- The `setProperty` function allows you to dynamically set CSS properties for the :root selector.
- The `remove` function allows you to remove the dynamically created <style> tag from the document head.

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | [`CSSGlobalPropertiesOptions`](interfaces/CSSGlobalPropertiesOptions.md) |

#### Returns

`Object`

An object containing the dynamically created <style> tag (`style`),
a `setProperty` function for setting CSS properties, and a `remove` function to
remove the <style> tag.

| Name | Type |
| :------ | :------ |
| `getComputedStyle` | () => `CSSStyleDeclaration` |
| `getPropertyValue` | (`name`: `string`) => `string` |
| `removeStyle` | () => `HTMLStyleElement` |
| `setProperty` | (`name`: `string`, `value`: `string`) => `void` |
| `style` | `HTMLStyleElement` |

**`Example`**

```ts
const { style, setProperty, remove } = useRootStyle();
setProperty("--my-css-variable", "red"); // Sets a CSS variable in :root
console.log(style); // Logs the <style> element
remove(); // Removes the <style> element from the document
```

#### Defined in

[styleHelpers.ts:24](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/styleHelpers.ts#L24)
