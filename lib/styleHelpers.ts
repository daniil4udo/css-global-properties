import type { IOptions } from './types'

export function createRootStyle({ media = 'all', id = undefined } = {}) {
    // Create the <style> tag
    const style = document.createElement('style')

    style.rel = 'stylesheet'
    style.media = media
    style.id = id ?? window.crypto.randomUUID()

    // WebKit hack
    style.appendChild(document.createTextNode(''))

    // Add the <style> element to the page
    document.head.appendChild(style)

    return style
}

/* Safely Applying Rules
Since browser support for insertRule isn't as global, it's best to create a wrapping function to do the rule application.  Here's a quick and dirty method: */
export function addCSSRule(sheet: HTMLStyleElement, selector = ':root', rules: string, index = 0) {
    if ('insertRule' in sheet.sheet)
        sheet.sheet.insertRule(`${selector} { ${rules} } `, index)

    else if ('addRule' in sheet.sheet)
        sheet.sheet.addRule(selector, rules, index)
}

export function isStyleOrLinkNode(node: Node) {
    return 'tagName' in node && (node.tagName === 'STYLE' || node.tagName === 'LINK')
}

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
export function createNormalizer({ normalize, autoprefix }: IOptions) {
    const cache = new Map()

    return (name: string | symbol): string => {
        if (cache.has(name))
            return cache.get(name)

        let normalizedName = typeof name === 'symbol' ? name.description : name ?? ''
        // if normalize was provided execute it
        if (normalize)
            normalizedName = normalize(normalizedName)

        // If CSS variable name does not start with '--', prefix it, when autoprefix=true,
        // or trigger an Error when not.
        if (normalizedName.substring(0, 2) !== '--') {
            if (autoprefix)
                normalizedName = `--${normalizedName}`

            else
                throw new Error('[normalizeVariableName] - Invalid CSS Variable name. Name must start with "--" (autoprefix=false)')
        }
        cache.set(name, normalizedName)

        return normalizedName
    }
}
