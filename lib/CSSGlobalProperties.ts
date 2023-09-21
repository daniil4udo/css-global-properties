// todo maybe make sense to transform CSS Vars to the static values for IE11
// https://www.npmjs.com/package/stylis-plugin-css-variables
// https://www.npmjs.com/package/css-vars-ponyfill

// Prefix as well
// https://www.npmjs.com/package/postcss-variables-prefixer-plugin

import type { CSSGlobalPropertiesOptions } from './types'

import { defaultsDeep,  isPlainObject, queryElement, toLower } from '@democrance/utils'

import { initObserver } from './initObserver'
import { createNormalizer, cssRulesEntries, testCrossOrigin,  useRootStyle } from './styleHelpers'

function keys<T extends Record<PropertyKey, any>>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>
}


/**
 * Creates an object to interact with global CSS properties.
 * This function provides a mechanism to live-get and set CSS variables and their values.
 * The returned object provides a proxy to directly interact with CSS variables
 * and a `stop` method to cease interactions and clean up observers.
 *
 * This function is a friendly fork of {@link https://github.com/colxi/css-global-variables | css-global-variables}.
 * **Note:** This function is intended to be used in a browser environment only.
 *
 * @param {CSSGlobalPropertiesOptions} [opts] - Configuration options for `CSSGlobalProperties`.
 * @param {boolean} [opts.autoprefix] - Indicates whether to autoprefix CSS properties.
 * @param {number} [opts.id] - ID associated with the instance configuration.
 * @param {string} [opts.idAttrTag] - HTML attribute for marking analyzed elements.
 * @param {string} [opts.ignoreAttrTag] - HTML attribute for marking ignored elements.
 * @param {(name: string) => string} [opts.normalize] - Function to normalize variable names.
 * @param {string} [opts.selector] - CSS selector for the root element.
 * @param {boolean} [opts.silent] - Suppresses console warnings if set to `true`.
 * @param {Console} [opts.logger] - Logger instance to use.
 * @param {string} [opts.filter] - CSS selector filter.
 * @param {MutationObserverInit} [opts.mutationObserveOptions] - Options for the mutation observer.
 *
 * @returns An object with two properties:
 * - `proxy`: Proxy object containing the CSS variables and their values. Provides bound methods for live-getting and setting of the variables and values.
 * - `isStopped`: Function that checks if Proxy has been revoked and observer disconnected.
 * - `stop`: Function that, when invoked, disconnects the observer and revokes the proxy.
 *
 * @throws {Error} Throws an error if the function is not executed in a browser environment.
 * @throws {TypeError} Throws a type error if the provided configuration is invalid.
 *
 * @example
 * ```ts
 * const cssProps = CSSGlobalProperties();
 * cssProps.proxy['--my-var'] = 'blue';
 * console.log(cssProps.proxy['--my-var']); // 'blue'
 * cssProps.stop();
 * ```
 */
export function CSSGlobalProperties<CSSProp extends string>(opts: CSSGlobalPropertiesOptions = {}) {
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
    const cssVarsRecord = {} as Record<CSSProp | `--${CSSProp}`, string>

    const stylesUpdatedEvent = new CustomEvent('stylesUpdated', { detail: cssVarsRecord })

    const normalizeVariableName = createNormalizer(globalConfigs)

    const {
        getPropertyValue,
        setProperty,
    } = useRootStyle(globalConfigs)

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
                if (isMember)
                    continue
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
            cssVarsRecord[key] = getPropertyValue(key)
        })

        return true
    }

    // Initialize the observer. Set the target and the config
    const observer = initObserver({
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
     */
    const proxy = Proxy.revocable(cssVarsRecord, {
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
            // document.documentElement.style.setProperty(normalizedName, String(value))
            setProperty(normalizedName, String(value))

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
                // document.documentElement.style.setProperty(normalizedName, value)
                setProperty(normalizedName, value)

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

    function isStopped() {
        try {
            // Trying to interact with the proxy
            // eslint-disable-next-line no-unused-expressions
            (proxy.proxy as any).foo
            return false
        }
        catch (error) {
            if (error instanceof TypeError && error.message.includes('illegal operation attempted on a revoked proxy'))
                return true

            throw error  // If it's another type of error, propagate it
        }
    }

    return {
        proxy: proxy.proxy,
        isStopped,
        stop: () => {
            observer.disconnect()
            proxy.revoke()
        },
    }
}
