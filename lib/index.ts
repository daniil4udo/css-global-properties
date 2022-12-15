// todo maybe make sense to transform CSS Vars to the static values for IE11
// https://www.npmjs.com/package/stylis-plugin-css-variables
// https://www.npmjs.com/package/css-vars-ponyfill

// Prefix as well
// https://www.npmjs.com/package/postcss-variables-prefixer-plugin

import { debounce, defaultsDeep } from '@democrance/utils'

export type CSSPixelValue = '0' | `${string}px`
export type CSSLengthValue = '0' | `${string}${ | '%'
| 'ch'
| 'cm'
| 'em'
| 'ex'
| 'in'
| 'mm'
| 'pc'
| 'pt'
| 'px'
| 'rem'
| 'vh'
| 'vmax'
| 'vmin'
| 'vw'
  }`
export type CSSAngleValue = `${string}${ | 'deg'
| 'grad'
| 'rad'
| 'turn'
  }`
export type CSSHexColor = `#${string}`

let __identifierCounter__ = 0

export interface IOptions {
    id?: number
    filter?: string
    autoprefix?: boolean
    normalize?: (name: string) => string
    Logger?: Pick<Console, 'info' | 'debug' | 'error' | 'warn'>
}

// https://github.com/colxi/css-global-variables
export function CSSGlobalVariables(configObj: IOptions = {}) {
    if (typeof window === 'undefined')
        return
    // Usage of 'new' keyword is mandatory
    // if (!new.target) throw new Error('Calling CSSGlobalVariables constructor without "new" is forbidden');

    // Validate Config Object type and property values types
    if (Object.prototype.toString.call(configObj) !== '[object Object]' && Object.getPrototypeOf(configObj) !== Object.getPrototypeOf({}))
        throw new Error('CSSGlobalVariables constructor expects a config Object as first argument')

    if ('normalize' in configObj && typeof configObj.normalize !== 'function')
        throw new Error('Config property "normalize" must be a function')

    if ('autoprefix' in configObj && typeof configObj.autoprefix !== 'boolean')
        throw new Error('Config property "autoprefix" must be a boolean')

    if ('filter' in configObj) {
        if (typeof configObj.filter !== 'string') {
            throw new TypeError('Config property "filter" must be a string')
        }
        else {
            try {
                document.querySelectorAll(configObj.filter)
            }
            catch (e) {
                throw new Error(`Provided "filter" is an invalid selector ("${configObj.filter}")`)
            }
        }
    }

    // __config__  : Object containing the instance configuration.
    // Declare config properties and default values...
    const __config__: IOptions = defaultsDeep(configObj, {
        autoprefix: true,
        normalize: null,
        Logger: console,
    })

    // Generate and assign instance ID
    __identifierCounter__++
    __config__.id = __identifierCounter__

    // __varsCache__ : Contains (internally) the CSS variables and values.
    const __varsCache__: Record<string, string> = {}
    const __event__ = new CustomEvent('stylesUpdated', { detail: __varsCache__ })

    /**
     *
     * normalizeVariableName()  Forces name to be a String, and attach the
     * mandatory '--' prefix when autoprefixer is Enabled
     *
     * @param  {[String]} name  Name of thw requested variable
     *
     * @return {[String]}
     *
     */
    const normalizeVariableName = useMemoize((name: string | symbol) => {
        name = name.toString()

        // if normalize was provided execute it
        if (__config__.normalize)
            name = __config__.normalize(name)

        // If CSS variable name does not start with '--', prefix it, when __config__.autoprefix=true,
        // or trigger an Error when not.
        if (name.substring(0, 2) !== '--') {
            if (__config__.autoprefix)
                name = `--${name}`

            else
                throw new Error('Invalid CSS Variable name. Name must start with "--" (autoprefix=false)')
        }

        return name
    })

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
        for (let ss = 0; ss < styleSheetsLen; ss++) {
            const styleSheet = styleSheets[ss]
            if (!(styleSheet.ownerNode instanceof Element))
                continue

            // if element has the ignore directive, ignore it and continue
            if (styleSheet.ownerNode.getAttribute('css-global-vars-ignore'))
                continue

            // if filters have been provided to constructor...
            if (__config__.filter) {
                // get all elements that match the filter...
                const elements = document.querySelectorAll(__config__.filter)
                let isMember = false

                // iterate all selector resulting collection
                const keysLen = Object.keys(elements).length
                for (let i = 0; i < keysLen; i++) {
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
                styleSheet.rules || styleSheet.cssRules
            }
            catch (e) {
                if (!styleSheet.ownerNode.hasAttribute('css-global-vars-ignore')) {
                    styleSheet.ownerNode.setAttribute('css-global-vars-ignore', 'true')
                    __config__.Logger.warn('[updateVarsCache] - Cross Origin Policy restrictions are blocking the access to the CSS rules of a remote stylesheet. The affected stylesheet is going to be ignored by CSSGlobalVariables. Check the documentation for instructions to prevent this issue.', e)
                }
                else {
                    __config__.Logger.warn('[updateVarsCache] - Unexpected error reading CSS properties.', e)
                }
                abort = true
            }

            if (abort)
                break

            // if Style element has been previously analyzed ignore it;
            // if not, mark element as analyzed to prevent future analysis
            const ids = styleSheet.ownerNode.getAttribute('css-global-vars-id')

            if (String(ids).split(',').includes(String(__config__.id)))
                continue

            // not cached yet!
            let value: number | string = styleSheet.ownerNode.getAttribute('css-global-vars-id')
            // check if is null or empty (cross-browser solution),
            // and attach the new instance id
            if (value === null || value === '')
                value = __config__.id

            else
                value += `,${__config__.id}`

            // set the new value to the object
            styleSheet.ownerNode.setAttribute('css-global-vars-id', String(value))

            // iterate each CSS rule...
            const rules = Array.from(styleSheet.rules || styleSheet.cssRules)
            const rulesLen = rules.length
            for (let r = 0; r < rulesLen; r++) {
                const cssRule = rules[r] as CSSStyleRule

                // select all elements in the scope
                // if (__scopes__[cssRule.selectorText]) {
                if (cssRule.selectorText === ':root') {
                    let css = cssRule.cssText.split('{')
                    css = css[1].replace('}', '').split(';')

                    const cssLen = css.length
                    // iterate each :root CSS property
                    for (let i = 0; i < cssLen; i++) {
                        const prop = css[i].split(':')

                        // if is a CSS variable property, insert in the cache
                        if (prop.length === 2 && prop[0].indexOf('--') === 1)
                            __varsCache__[prop[0].trim()] = prop[1].trim()
                    }
                }
            }
        }

        // After collecting all the variables definitions, check their computed
        // values, consulting the :root element inline style definitions,
        // and assigning those values to the variables, in cache
        for (const p in __varsCache__) {
            if (p in __varsCache__)
                __varsCache__[p] = window.getComputedStyle(document.documentElement, null).getPropertyValue(p).trim()
        }

        return true
    }

    /**
     *
     * Create a mutation observer
     * When new styles are attached to the DOM (Style or Link element)
     * will perform an update of the document CSS variables
     *
     * @param target
     * @param options
     *
     * @returns {[MutationObserver]}
     *
     */
    function initObserver(target: Node = document.documentElement, options: MutationObserverInit = {}) {
        const observer = new MutationObserver(debounce((mutations) => {
            let update = false
            const mutationsRecordLen = mutations.length
            for (let m = 0; m < mutationsRecordLen; m++) {
                const mutation = mutations[m]

                if (mutation.type === 'childList') {
                    let len = mutation.addedNodes.length
                    for (let i = 0; i < len; i++) {
                        // TODO: find better way then type casting as Element
                        if ((mutation.addedNodes[i] as HTMLElement).tagName === 'STYLE' || (mutation.addedNodes[i] as HTMLElement).tagName === 'LINK') {
                            update = true
                            break
                        }
                    }

                    // if update already
                    // no need to check deleted nodes, just trigger cache update
                    if (update)
                        break

                    len = mutation.removedNodes.length
                    for (let i = 0; i < len; i++) {
                        if ((mutation.removedNodes[i] as HTMLElement).tagName === 'STYLE' || (mutation.removedNodes[i] as HTMLElement).tagName === 'LINK') {
                            update = true
                            break
                        }
                    }
                }
            }

            if (update) {
                updateVarsCache()
                window.dispatchEvent(__event__)
                // update needs to be scheduled to guarantee that the new styles
                // are visible through the document.styleSheets API
                // setTimeout(() => {
                //     updateVarsCache();
                //     window.dispatchEvent(__event__);
                // }, 200);
            }
        }, 23))

        options = defaultsDeep(options, {
            attributes: false,
            childList: true,
            characterData: true,
            subtree: true,
        })

        return (observer.observe(target, options), observer)
    }

    // Initialize the observer. Set the target and the config
    initObserver()

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
    return new Proxy(__varsCache__, {
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
            value = String(value)
            // set the variable value
            document.documentElement.style.setProperty(normalizedName, value)

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

            if (isPlainObject(attr) && has(attr, 'value')) {
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

export const cssVars = CSSGlobalVariables({
    normalize: name => name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`),
})
