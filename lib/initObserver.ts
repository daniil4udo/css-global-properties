import type { InitObserver } from './types'

import { defaultsDeep } from '@democrance/utils'

import { isStyleOrLinkNode } from './styleHelpers'
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
const DEFAULT_OPTIONS: MutationObserverInit = {
    attributes: false,
    childList: true,
    characterData: true,
    subtree: true,
}

export function initObserver({ target = document.documentElement, options = {}, onUpdate }: InitObserver = {}) {
    const mutationCallback = (mutations) => {
        let update = false

        const mutationsRecordLen = mutations.length
        for (let m = 0; m < mutationsRecordLen; m++) {
            const mutation = mutations[m]

            if (mutation.type === 'childList') {
                const addedNodesLen = mutation.addedNodes.length
                for (let i = 0; i < addedNodesLen; i++) {
                    if (isStyleOrLinkNode(mutation.addedNodes[i])) {
                        update = true
                        break
                    }
                }

                // if update already
                // no need to check deleted nodes, just trigger cache update
                if (update)
                    break

                const removedNodesLen = mutation.removedNodes.length
                for (let i = 0; i < removedNodesLen; i++) {
                    if (isStyleOrLinkNode(mutation.removedNodes[i])) {
                        update = true
                        break
                    }
                }
            }
        }

        if (update) {
            // update needs to be scheduled to guarantee that the new styles
            // are visible through the document.styleSheets API
            // setTimeout(() => {
            //     updateVarsCache();
            //     window.dispatchEvent(__event__);
            // }, 200);
            if (typeof onUpdate === 'function') {
                requestAnimationFrame(() => {
                    onUpdate()
                })
            }
        }
    }
    const defaultOptions = defaultsDeep(options ?? {}, DEFAULT_OPTIONS)
    const observer = new MutationObserver(mutationCallback)

    observer.observe(target, defaultOptions)

    return observer
}
