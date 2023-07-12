import type { IOptions } from './types';

import { toUpper } from '@democrance/utils';

/**
 * Creates a root style tag in the document's head.
 *
 * @param config - An optional configuration object.
 * @param config.media - Specifies the media type of the style.
 *   Default is 'all'.
 * @param config.id - An optional id for the style tag.
 *   A random UUID will be generated if no id is provided.
 * @returns The created style element.
 */
export function createRootStyle({ media = 'all', id = undefined } = {}) {
    // Create the <style> tag
    const style = document.createElement('style');

    // style.rel = 'stylesheet'
    style.media = media;
    style.id = id ?? window.crypto.randomUUID();

    // WebKit hack
    style.appendChild(document.createTextNode(''));

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style;
}

/**
 * Adds a CSS rule to a given stylesheet.
 *
 * @param sheet - The stylesheet to which the rule should be added.
 * @param selector - The CSS selector for the rule. Defaults to ':root'.
 * @param rules - The CSS rules to be added.
 * @param index - The index at which the rule should be inserted in the stylesheet. Defaults to 0.
 */
export function addCSSRule(sheet: HTMLStyleElement, selector = ':root', rules: string, index = 0): void {
    if ('insertRule' in sheet.sheet)
        sheet.sheet.insertRule(`${selector} { ${rules} }`, index);
}

export function isAllowedTagName(node: Node, allowedTagNames = [ 'STYLE', 'LINK' ]) {
    return 'tagName' in node && allowedTagNames.includes(toUpper(node.tagName as string));
}

/**
 *
 * Safely Applying Rules
 * Since browser support for insertRule isn't as global, it's best to create a wrapping function to do the rule application.
 *
 * @param {CSSStyleSheet} styleSheet
 * @param {IOptions} globalConfigs
 *
 * @returns {boolean|{ reason?: 'cors', error: Error }}
 */
export function testCrossOrigin(styleSheet: CSSStyleSheet, { ignoreAttrTag }: IOptions): boolean | { reason?: 'cors'; error: Error } {
    try {
        // eslint-disable-next-line no-unused-expressions
        styleSheet.cssRules;

        return false;
    }
    catch (e) {
        const error = new Error(e);

        if (!(styleSheet.ownerNode as Element).hasAttribute(ignoreAttrTag)) {
            (styleSheet.ownerNode as Element).setAttribute(ignoreAttrTag, 'true');

            return {
                reason: 'cors',
                error,
            };
        }

        return { error };
    }
}

/**
 * Iterates over a list of CSS rules, finding CSSStyleRules that match a specific selector
 * and returns an array of tuples representing CSS properties and their values.
 *
 * @param rules - An array of CSSRule objects.
 * @param options - An options object. It requires a 'selector' property.
 * @returns An array of tuples. Each tuple consists of a CSS property and its corresponding value.
 */
export function cssRulesEntries(rules: CSSRule[], { selector }: IOptions) {
    const propsEntries: [ string, string ][] = [];

    for (const cssRule of rules) {
        // https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
        if (cssRule instanceof CSSStyleRule) {
            // select all elements in the scope
            // if (__scopes__[cssRule.selectorText]) {
            if (cssRule.selectorText === selector) {
                const css = cssRule.cssText
                    .split('{')[1]
                    .replace('}', '')
                    .split(';');

                const cssLen = css.length;
                // iterate each :root CSS property
                for (let i = 0; i < cssLen; i++) {
                    const prop = css[i].split(':');

                    // if is a CSS variable property, insert in the cache
                    if (prop.length === 2 && prop[0].indexOf('--') === 1) {
                        propsEntries.push([
                            prop[0].trim(),
                            prop[1].trim(),
                        ]);
                        // varsCacheMap.set(prop[0].trim(), prop[1].trim())
                    }
                }
            }
        }
    }

    return propsEntries;
}

/**
 *
 * @param {Element} node
 * @param {IOptions} globalConfigs
 *
 * @returns {string} Node attribute or concatenated list of attributes
 */
export function getAttribute(node: Element, { id, idAttrTag }: IOptions) {
    let value: string = node.getAttribute(idAttrTag);
    // check if is null or empty (cross-browser solution),
    // and attach the new instance id
    if (value == null || value === '')
        return `${id}`;
    value += `,${id}`;

    return value;
}

/**
*
* normalizeVariableName()  Forces name to be a String, and attach the
* mandatory '--' prefix when autoprefixer is Enabled
*
* @param  {IOptions} normalizerOptions  Name of the requested variable

* @return {Function} - Creates normalizer function base on givent options
*/
export function createNormalizer({ normalize, autoprefix }: IOptions) {
    const cache = new Map();

    return (name: string | symbol): string => {
        if (cache.has(name))
            return cache.get(name);

        let normalizedName = typeof name === 'symbol' ? name.description : name ?? '';
        // if normalize was provided execute it
        if (normalize)
            normalizedName = normalize(normalizedName);

        // If CSS variable name does not start with '--', prefix it, when autoprefix=true,
        // or trigger an Error when not.
        if (normalizedName.substring(0, 2) !== '--') {
            if (autoprefix)
                normalizedName = `--${normalizedName}`;

            else
                throw new Error('[normalizeVariableName] - Invalid CSS Variable name. Name must start with "--" (autoprefix=false)');
        }
        cache.set(name, normalizedName);

        return normalizedName;
    };
}
