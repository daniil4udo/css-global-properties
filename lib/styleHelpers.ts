import type { CSSGlobalPropertiesOptions } from './types'
import type { Memoized } from 'micro-memoize'

import { hasValue, memoize } from '@democrance/utils'

/**
 * Creates and appends a `<style>` element to the document's head.
 *
 * This function creates a `<style>` element, sets its media type, optionally sets its ID, and then appends it to the `<head>` of the document.
 * It's particularly useful for dynamic stylesheet injection. A WebKit hack is applied to the `<style>` tag for compatibility.
 *
 * @remarks
 * - The created `<style>` element is returned for further manipulation.
 * - The ID of the `<style>` element is generated using `window.crypto.randomUUID()` if not provided.
 *
 * @example
 * ```typescript
 * const styleElement = createRootStyle({ media: 'print', id: 'print-styles' });
 * ```
 *
 * @param options - An optional configuration object
 * @param options.media - The media type of the `<style>` tag (default is `'all'`)
 * @param options.id - The ID to set for the `<style>` element. If not specified, a random ID will be generated
 *
 * @returns The created and appended `<style>` element
 */
export function createHeadStyleTag({ media = 'all', id = undefined } = {}) {
    // Create the <style> tag
    const style = document.createElement('style')

    // style.rel = 'stylesheet'
    style.media = media
    style.id = id ?? window.crypto.randomUUID()

    // WebKit hack
    style.appendChild(document.createTextNode(''))

    // Add the <style> element to the page
    document.head.appendChild(style)

    return style
}

/**
 * Inserts a new CSS rule into the specified stylesheet.
 *
 * Adds a CSS rule to an existing `<style>` sheet element by using the CSSStyleSheet's `insertRule` method.
 * The rule is inserted at a specific index in the stylesheet or appended at the end if no index is provided.
 *
 * @remarks
 * - Make sure the `sheet` parameter is a valid `<style>` element that has been added to the DOM.
 * - The function does nothing if the `sheet` or its `sheet` property is `null`.
 *
 * @example
 * ```typescript
 * const styleSheet = createRootStyle(); // Assume createRootStyle creates and returns a <style> element
 * addCSSRule(styleSheet, { selector: '.my-class', rules: 'background-color: red; color: white;' });
 * ```
 *
 * @param sheet - The `<style>` element containing the CSS rules.
 * @param opts - An optional object containing the rule options.
 * @param opts.selector - The CSS selector for the rule (default is `':root'`).
 * @param opts.rules - The CSS rules to apply to the selector, written as a string.
 * @param opts.index - The index at which to insert the rule in the stylesheet (default is `0`).
 */
export function addCSSRule(sheet: HTMLStyleElement, opts: { selector?: string; rules?: string; index?: number } = {}) {
    const {
        selector = ':root',
        rules,
        index = 0,
    } = opts

    if (!hasValue(rules))
        throw new TypeError('addCSSRule: missing required parameter "rules"')


    if (sheet?.sheet != null && 'insertRule' in sheet.sheet)
        sheet.sheet.insertRule(`${selector} { ${rules} }`, index)

}

/**
 * Checks if a given DOM node's tag name is among a list of allowed tag names.
 *
 * This function takes a DOM `Node` and an optional array of allowed tag names (defaulting to 'STYLE' and 'LINK'),
 * and returns a boolean indicating whether the node's tag name is among those that are allowed.
 *
 * @remarks
 * - The function performs a case-insensitive check.
 * - If the node does not have a `tagName` property, the function will return `false`.
 *
 * @example
 * ```typescript
 * const element = document.createElement('style');
 * const isAllowed = isAllowedTagName(element); // Returns true
 * ```
 *
 * @example
 * ```typescript
 * const textNode = document.createTextNode('Hello');
 * const isAllowed = isAllowedTagName(textNode); // Returns false
 * ```
 *
 * @param node - The DOM node to check.
 * @param allowedTagNames - An optional array of allowed tag names (default is `['STYLE', 'LINK']`).
 *
 * @returns A boolean indicating whether the `node`'s tag name is among the `allowedTagNames`.
 */
export function isAllowedTagName(node: Node, allowedTagNames = [ 'STYLE', 'LINK' ]) {
    if ('tagName' in node) {
        return allowedTagNames.some(allowed => {
            return new RegExp(`^${allowed}$`, 'i').test(`${node.tagName}`)
        })
    }

    return false
}

/**
 * Tests the cross-origin status of a given CSS stylesheet.
 *
 * This function attempts to access the `cssRules` property of a `CSSStyleSheet` object to detect if it's a
 * cross-origin stylesheet. If it's cross-origin and causes an exception, further processing is performed.
 *
 * @remarks
 * - This function should only be used for stylesheets that have been fully loaded.
 * - If a CORS (Cross-Origin Resource Sharing) error is detected, the `ignoreAttrTag` attribute will be set on the
 *   stylesheet's owner node, unless the attribute already exists.
 * - If the function is able to successfully access `cssRules`, it returns `false`.
 * - If a CORS error occurs, it returns an object with a `reason` key set to `'cors'` and an `error` key containing
 *   the caught error.
 * - If another type of error occurs, it returns an object with just the `error` key.
 *
 * @example
 * ```typescript
 * const mySheet = document.styleSheets[0] as CSSStyleSheet;
 * const result = testCrossOrigin(mySheet, { ignoreAttrTag: 'data-ignore-cors' });
 * ```
 *
 * @param styleSheet - The stylesheet to test.
 * @param options - Configuration options.
 * @param options.ignoreAttrTag - The attribute to set on the stylesheet's owner node if a CORS error is detected.
 *
 * @returns Either `false` if no error, or an object describing the error.
 */
export function testCrossOrigin(styleSheet: CSSStyleSheet, { ignoreAttrTag = '' }: CSSGlobalPropertiesOptions): boolean | { reason?: 'cors'; error: Error } {
    try {
        // eslint-disable-next-line no-unused-expressions
        styleSheet.cssRules

        return false
    }
    catch (err) {
        const error = err instanceof Error
            ? err
            : new Error(`${err}`)

        if (styleSheet?.ownerNode instanceof Element) {
            if (!styleSheet.ownerNode.hasAttribute(ignoreAttrTag)) {
                styleSheet.ownerNode.setAttribute(ignoreAttrTag, 'true')

                return {
                    reason: 'cors',
                    error,
                }
            }
        }

        return { error }
    }
}

/**
 * Extracts CSS custom properties (variables) from a list of CSS rules based on a specified selector.
 *
 * This function iterates through an array of CSS rules and collects the CSS custom properties defined
 * in rules that match the provided selector. The extracted properties are returned as an array of key-value pairs.
 *
 * @remarks
 * - The function specifically looks for CSS custom properties, which are variables prefixed with `--`.
 * - Only CSS rules of type `CSSStyleRule` are considered.
 *
 * @example
 * ```typescript
 * const myRules = document.styleSheets[0].cssRules;
 * const options = { selector: ':root' };
 * const entries = cssRulesEntries(myRules as any[], options);
 * ```
 *
 * @param rules - An array of `CSSRule` objects to search through.
 * @param options - Configuration options.
 * @param options.selector - The CSS selector to match against each rule's selector text.
 *
 * @returns An array of key-value pairs representing the CSS custom properties and their values.
 */
export function cssRulesEntries(rules: CSSRule[], { selector }: CSSGlobalPropertiesOptions): [string, string][] {
    const propsEntries: [ string, string ][] = []

    for (const cssRule of rules) {
        // https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
        if (cssRule instanceof CSSStyleRule) {
            // select all elements in the scope
            // if (__scopes__[cssRule.selectorText]) {
            if (cssRule.selectorText === selector) {
                const css = cssRule.cssText
                    .split('{')[1]
                    .replace('}', '')
                    .split(';')

                // iterate each :root CSS property
                for (let i = 0, cssLen = css.length; i < cssLen; i++) {
                    const prop = css[i].split(':')

                    // if is a CSS variable property, insert in the cache
                    if (prop.length === 2 && prop[0].indexOf('--') === 1) {
                        propsEntries.push([
                            prop[0].trim(),
                            prop[1].trim(),
                        ])
                        // varsCacheMap.set(prop[0].trim(), prop[1].trim())
                    }
                }
            }
        }
    }

    return propsEntries
}

export { memoize } from '@democrance/utils'

/**
 * Creates a function to normalize CSS variable names.
 *
 * This function takes an options object with `normalize` and `autoprefix` properties. It returns a function that
 * normalizes the name of a CSS variable based on these options. The returned function also utilizes caching to
 * avoid redundant computations.
 *
 * @remarks
 * - If `normalize` is provided, it will be executed on the CSS variable name.
 * - If `autoprefix` is set to `true`, the CSS variable name will be prefixed with `--` if it doesn't already start with `--`.
 * - If `autoprefix` is set to `false`, an error will be thrown if the CSS variable name doesn't start with `--`.
 *
 * @example
 * ```typescript
 * const normalizer = createNormalizer({ normalize: name => name.toUpperCase(), autoprefix: true });
 * const normalized = normalizer('my-var'); // Output: '--MY-VAR'
 * ```
 *
 * @param options - Configuration options.
 * @param options.normalize - A function to transform the CSS variable name.
 * @param options.autoprefix - Whether to automatically prefix unprefixed variable names with `--`.
 *
 * @returns A function that takes a CSS variable name (string or symbol) and returns a normalized name.
 */
export function createNormalizer({ normalize, autoprefix }: CSSGlobalPropertiesOptions = {}) {
    const normalizer = (name: string | symbol): string => {
        let normalizedName = typeof name === 'symbol' ? name.description! : name

        // if normalize was provided execute it
        if (normalize)
            normalizedName = normalize(normalizedName)

        // If CSS variable name does not start with '--', prefix it, when autoprefix=true,
        // or trigger an Error when not.
        if (normalizedName.substring(0, 2) !== '--') {
            if (autoprefix)
                normalizedName = `--${normalizedName}`

            else
                throw new Error('[createNormalizer] - Invalid CSS Variable name. Name must start with "--" (autoprefix=false)')
        }

        return normalizedName
    }

    return memoize(normalizer) as Memoized<typeof normalizer>
}
