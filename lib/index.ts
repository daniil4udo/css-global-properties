// todo maybe make sense to transform CSS Vars to the static values for IE11
// https://www.npmjs.com/package/stylis-plugin-css-variables
// https://www.npmjs.com/package/css-vars-ponyfill

// Prefix as well
// https://www.npmjs.com/package/postcss-variables-prefixer-plugin

import type { IOptions } from './types'

import { defaultsDeep } from '@democrance/utils'

import { initObserver } from './initObserver'
import { createNormalizer } from './styleHelpers'

let id = 0

// https://github.com/colxi/css-global-variables
export function CSSGlobalProperties(conf: IOptions = {}) {
    if (typeof window === 'undefined')
        return
    // Usage of 'new' keyword is mandatory
    // if (!new.target) throw new Error('Calling CSSGlobalProperties constructor without "new" is forbidden');

    // Validate Config Object type and property values types
    if (Object.prototype.toString.call(conf) !== '[object Object]' && Object.getPrototypeOf(conf) !== Object.getPrototypeOf({}))
        throw new Error('[CSSGlobalProperties] - constructor expects a config Object as first argument')

    if ('normalize' in conf && typeof conf.normalize !== 'function')
        throw new Error('[CSSGlobalProperties] - Config property "normalize" must be a function')

    if ('autoprefix' in conf && typeof conf.autoprefix !== 'boolean')
        throw new Error('[CSSGlobalProperties] - Config property "autoprefix" must be a boolean')

    if ('filter' in conf) {
        if (typeof conf.filter !== 'string') {
            throw new TypeError('[CSSGlobalProperties] - Config property "filter" must be a string')
        }
        else {
            try {
                document.querySelectorAll(conf.filter)
            }
            catch (e) {
                throw new Error(`[CSSGlobalProperties] - Provided "filter" is an invalid selector ("${conf.filter}")`)
            }
        }
    }

    // globalConfigs  : Object containing the instance configuration.
    // Declare config properties and default values...
    const globalConfigs: IOptions = defaultsDeep(conf, {
        autoprefix: true,
        normalize: null,

        Logger: console,

        ignoreAttrTag: 'css-global-vars-ignore',
        idAttrTag: 'css-global-vars-id',

        // document.documentElement
        selector: ':root',
    })

    // Generate and assign instance ID
    id++
    globalConfigs.id = id

    // varsCacheMap : Contains (internally) the CSS variables and values.
    const varsCacheMap = new Map()
    const stylesUpdatedEvent = new CustomEvent('stylesUpdated', { detail: varsCacheMap })

    const normalizeVariableName = createNormalizer(globalConfigs)

    /**
     *
     * updateVarsCache() : Updates the variables and values cache object. Inspects
     * STYLE elements and attached stylesheets, ignoring those that have been
     * previously checked. Finally checks the inline CSS variables declarations.
     * Analyzed Elements will be Flagged with an Html attribute
     *
     * @return {[Boolean]} Returns true
     *
     */
    function updateVarsCache() {
        // iterate all document stylesheets
        const styleSheets = Array.from(document.styleSheets)

        const styleSheetsLen = styleSheets.length
        for (let i = 0; i < styleSheetsLen; i++) {
            const styleSheet = styleSheets[i]

            // This is usually an HTML <link> or <style> element, but can also return a processing instruction node in the case of <?xml-stylesheet ?>.
            if (styleSheet.ownerNode instanceof ProcessingInstruction)
                continue

            // if element has the ignore directive, ignore it and continue
            if (styleSheet.ownerNode.getAttribute(globalConfigs.ignoreAttrTag))
                continue

            // if filters have been provided to constructor...
            if (globalConfigs.filter) {
                // get all elements that match the filter...
                const elements = Array.from(document.querySelectorAll(globalConfigs.filter))
                let isMember = false

                // iterate all selector resulting collection
                const elementsLen = Object.keys(elements).length
                for (let i = 0; i < elementsLen; i++) {
                    // if current element matches the current stylesheet,
                    // set flag to true and finish iteration
                    if (elements[i] === styleSheet.ownerNode) {
                        isMember = true
                        break
                    }
                }

                // if any filtered element matched the current stylesheet abort.
                if (!isMember)
                    return false
            }

            let abort = false
            try {
                // eslint-disable-next-line no-unused-expressions
                styleSheet.cssRules
            }
            catch (e) {
                if (!styleSheet.ownerNode.hasAttribute(globalConfigs.ignoreAttrTag)) {
                    styleSheet.ownerNode.setAttribute(globalConfigs.ignoreAttrTag, 'true')
                    globalConfigs.Logger.warn('[updateVarsCache] - Cross Origin Policy restrictions are blocking the access to the CSS rules of a remote stylesheet. The affected stylesheet is going to be ignored by CSSGlobalProperties. Check the documentation for instructions to prevent this issue.', e)
                }
                else {
                    globalConfigs.Logger.warn('[updateVarsCache] - Unexpected error reading CSS properties.', e)
                }
                abort = true
            }

            if (abort)
                break

            // if Style element has been previously analyzed ignore it;
            // if not, mark element as analyzed to prevent future analysis
            const ids = styleSheet.ownerNode.getAttribute(globalConfigs.idAttrTag)

            if (String(ids).split(',').includes(String(globalConfigs.id)))
                continue

            // not cached yet!
            let value: string = styleSheet.ownerNode.getAttribute(globalConfigs.idAttrTag)
            // check if is null or empty (cross-browser solution),
            // and attach the new instance id
            if (value == null || value === '')
                value = `${globalConfigs.id}`

            else
                value += `,${globalConfigs.id}`

            // set the new value to the object
            styleSheet.ownerNode.setAttribute(globalConfigs.idAttrTag, String(value))

            // iterate each CSS rule...
            const rules = Array.from(styleSheet.cssRules)

            const rulesLen = rules.length
            for (let r = 0; r < rulesLen; r++) {
                const cssRule = rules[r]

                // https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
                if (cssRule instanceof CSSStyleRule) {
                    // select all elements in the scope
                    // if (__scopes__[cssRule.selectorText]) {
                    if (cssRule.selectorText === globalConfigs.selector) {
                        let css = cssRule.cssText.split('{')
                        css = css[1].replace('}', '').split(';')

                        const cssLen = css.length
                        // iterate each :root CSS property
                        for (let i = 0; i < cssLen; i++) {
                            const prop = css[i].split(':')

                            // if is a CSS variable property, insert in the cache
                            if (prop.length === 2 && prop[0].indexOf('--') === 1)
                                // varsCacheMap[prop[0].trim()] = prop[1].trim()
                                varsCacheMap.set(prop[0].trim(), prop[1].trim())
                        }
                    }
                }
            }
        }

        // After collecting all the variables definitions, check their computed
        // values, consulting the :root element inline style definitions,
        // and assigning those values to the variables, in cache
        varsCacheMap.forEach((value, p) => {
            const getPropertyValue = window
                .getComputedStyle(document.documentElement, null)
                .getPropertyValue(p).trim()

            varsCacheMap.set(p, getPropertyValue)
        })

        return true
    }

    // Initialize the observer. Set the target and the config
    initObserver({
        options: conf.mutationObserveOptions,
        onUpdate: () => {
            updateVarsCache()
            window.dispatchEvent(stylesUpdatedEvent)
        },
    })

    // analyze the document style elements to generate
    // the collection of CSS variables, and return the proxy object
    updateVarsCache()

    /**
     *
     * varsCacheProxy (Proxy Object) : Public Proxy object containing the CSS
     * variables and their values. Provides bound methods for live getting and
     * setting of the variables and values.
     *
     * @type {[Proxy]}
     *
     */
    return new Proxy(varsCacheMap, {
        get(target, name) {
            // check if there is any new CSS declarations to be considered
            // before returning any
            // updateVarsCache();
            const normalizedName = normalizeVariableName(name)
            return Reflect.get(target, normalizedName)
        },
        set(target, name, value) {
            // updateVarsCache();
            const normalizedName = normalizeVariableName(name)

            // set the variable value
            document.documentElement.style.setProperty(normalizedName, String(value))

            // update the cache object
            return Reflect.set(target, name, value)
        },
        deleteProperty() {
            /* not allowed */
            // updateVarsCache();
            return false
        },
        has(target, name) {
            // updateVarsCache();
            const normalizedName = normalizeVariableName(name)
            return Reflect.has(target, normalizedName)
        },
        defineProperty(target, name, attr) {
            //
            // it only allows to set the value
            //
            // updateVarsCache();
            const normalizedName = normalizeVariableName(name)

            if (attr?.value != null) {
                const value = attr.value.toString()

                // set the CSS variable value
                document.documentElement.style.setProperty(normalizedName, value)

                // update the cache
                Reflect.set(target, normalizedName, value)
            }

            return false // orTarget
        },
        ownKeys(target) {
            // updateVarsCache();
            return Reflect.ownKeys(target)
        },
        getOwnPropertyDescriptor(target, name) {
            // updateVarsCache();
            const normalizedName = normalizeVariableName(name)
            return Reflect.getOwnPropertyDescriptor(target, normalizedName)
        },
    })
}

export const cssVars = CSSGlobalProperties({
    // normalize: name => name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
})
