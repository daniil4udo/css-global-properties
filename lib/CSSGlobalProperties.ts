// todo maybe make sense to transform CSS Vars to the static values for IE11
// https://www.npmjs.com/package/stylis-plugin-css-variables
// https://www.npmjs.com/package/css-vars-ponyfill

// Prefix as well
// https://www.npmjs.com/package/postcss-variables-prefixer-plugin

import type { CSSGlobalPropertiesOptions } from './types'

import { defaultsDeep,  isPlainObject, queryElement, toLower } from '@democrance/utils'

import { initObserver } from './initObserver'
import { createNormalizer, cssRulesEntries,  testCrossOrigin } from './styleHelpers'

function keys<T extends Record<PropertyKey, any>>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>
}

// https://github.com/colxi/css-global-variables
export function CSSGlobalProperties<CSSVarNames extends string>(
    opts: CSSGlobalPropertiesOptions = {},
) {
    if (typeof window === 'undefined')
        throw new Error('[CSSGlobalProperties] - This library only works in the browser environment')

    // Usage of 'new' keyword is mandatory
    // if (!new.target) throw new Error('Calling CSSGlobalProperties constructor without "new" is forbidden');

    // Validate Config Object type and property values types
    if (!isPlainObject(opts))
        throw new TypeError('[CSSGlobalProperties] - constructor expects a config Object as first argument')

    if ('normalize' in opts && typeof opts.normalize !== 'function')
        throw new TypeError('[CSSGlobalProperties] - Config property "normalize" must be a function')

    if ('autoprefix' in opts && typeof opts.autoprefix !== 'boolean')
        throw new TypeError('[CSSGlobalProperties] - Config property "autoprefix" must be a boolean')

    if ('filter' in opts) {
        if (typeof opts.filter !== 'string') {
            throw new TypeError('[CSSGlobalProperties] - Config property "filter" must be a string')
        }
        else {
            try {
                queryElement(opts.filter)
            }
            catch (e) {
                throw new Error(`[CSSGlobalProperties] - Provided "filter" is an invalid selector ("${opts.filter}")`)
            }
        }
    }

    // globalConfigs  : Object containing the instance configuration.
    // Declare config properties and default values...
    const globalConfigs = defaultsDeep(opts, {
        autoprefix: true,
        id: 0,
        idAttrTag: 'data-css-global-vars-id',
        ignoreAttrTag: 'data-css-global-vars-ignore',
        normalize: null,
        selector: ':root',
        silent: true,
        logger: console,
    })

    // cssVarsRecord : Contains (internally) the CSS variables and values.
    const cssVarsRecord = {} as Record<CSSVarNames | `--${CSSVarNames}`, string>

    const stylesUpdatedEvent = new CustomEvent('stylesUpdated', { detail: cssVarsRecord })

    const normalizeVariableName = createNormalizer(globalConfigs)

    /**
     *
     * updateVarsCache() : Updates the variables and values cache object. Inspects
     * STYLE elements and attached stylesheets, ignoring those that have been
     * previously checked. Finally checks the inline CSS variables declarations.
     * Analyzed Elements will be Flagged with an Html attribute
     *
     * @return {[boolean]}
     *
     */
    function updateVarsCache(): boolean {
        // iterate all document stylesheets
        for (const styleSheet of document.styleSheets) {
            // This is usually an HTML <link> or <style> element, but can also return a processing instruction node in the case of <?xml-stylesheet ?>.
            if (styleSheet.ownerNode == null || styleSheet.ownerNode instanceof ProcessingInstruction)
                continue

            // if element has the ignore directive, ignore it and continue
            if (styleSheet.ownerNode.getAttribute(globalConfigs.ignoreAttrTag))
                continue

            // if filters have been provided to constructor...
            if (globalConfigs.filter) {
                // get all elements that match the filter...
                const elements = queryElement(globalConfigs.filter)
                let isMember = false

                // iterate all selector resulting collection
                for (const element of elements) {
                    // if current element matches the current stylesheet,
                    // set flag to true and finish iteration
                    if (element === styleSheet.ownerNode) {
                        isMember = true
                        break
                    }
                }

                // if any filtered element matched the current stylesheet abort.
                if (!isMember)
                    return false
            }

            const abort = testCrossOrigin(styleSheet, globalConfigs)
            if (abort) {
                if (!globalConfigs.silent && typeof abort !== 'boolean') {
                    if ((toLower(abort.reason) === 'cors'))
                        globalConfigs.logger.warn('[updateVarsCache] - Cross Origin Policy restrictions are blocking the access to the CSS rules of a remote stylesheet. The affected stylesheet is going to be ignored by CSSGlobalProperties. Check the documentation for instructions to prevent this issue.', abort.error)
                    else
                        globalConfigs.logger.warn('[updateVarsCache] - Unexpected error reading CSS properties.', abort.error)
                }

                continue
            }

            // if Style element has been previously analyzed ignore it;
            // if not, mark element as analyzed to prevent future analysis
            const ids = styleSheet.ownerNode.getAttribute(globalConfigs.idAttrTag)

            // if (String(ids).split(',').includes(String(globalConfigs.id)))
            if (ids != null)
                continue

            // not cached yet!
            // set the new value to the object
            globalConfigs.id += 1
            styleSheet.ownerNode.setAttribute(globalConfigs.idAttrTag, String(globalConfigs.id))

            // iterate each CSS rule...
            const cssEntries = cssRulesEntries(
                styleSheet.cssRules,
                globalConfigs,
            )

            if (cssEntries.length > 0) {
                Object.assign(
                    cssVarsRecord,
                    Object.fromEntries(cssEntries),
                )
            }
        }

        // After collecting all the variables definitions, check their computed
        // values, consulting the :root element inline style definitions,
        // and assigning those values to the variables, in cache
        keys(cssVarsRecord).forEach(key => {
            const getPropertyValue = window
                .getComputedStyle(document.documentElement, null)
                .getPropertyValue(key).trim()

            // cssVarsRecord.set(key, getPropertyValue);
            cssVarsRecord[key] = getPropertyValue
        })

        return true
    }

    // Initialize the observer. Set the target and the config
    initObserver({
        options: opts.mutationObserveOptions,
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
     * @type {Proxy}
     *
     */
    return new Proxy(cssVarsRecord, {
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
