import type { InitObserver } from './types'

import { defaultsDeep } from '@democrance/utils/defaultsDeep'

import { isAllowedTagName } from './styleHelpers'

const DEFAULT_OPTIONS: MutationObserverInit = {
    attributes: false,
    childList: true,
    characterData: true,
    subtree: true,
}

/**
 * Initializes a MutationObserver to watch for DOM mutations.
 *
 * The function takes an optional configuration object with a target element to observe, options for the observer,
 * and a callback function that gets executed when a mutation occurs. The callback will only be triggered if
 * one of the mutations involves an element with a tag name that passes the `isAllowedTagName` check.
 *
 * @remarks
 * - By default, the observer will target the `document.documentElement` if no `target` is provided.
 * - The `onUpdate` function is scheduled via `requestAnimationFrame` to ensure that any required changes
 *   are processed as soon as possible in the browser's update cycle.
 *
 * @example
 * ```typescript
 * const onUpdate = () => console.log('DOM updated');
 * const observer = initObserver({ onUpdate });
 * ```
 *
 * @param config - Configuration options for initializing the observer.
 * @param config.target - The DOM element that will be observed. Default is `document.documentElement`.
 * @param config.options - Optional configuration object for the MutationObserver.
 * @param config.onUpdate - Callback function to be executed when a relevant mutation occurs.
 *
 * @returns A MutationObserver instance configured based on the given options.
 */
export function initObserver({
    target = document.documentElement,
    options,
    onUpdate,
}: InitObserver = {}): MutationObserver {
    const callback: MutationCallback = mutations => {
        let update = false

        for (const mutation of mutations) {
            if (mutation.type !== 'childList')
                continue

            for (const anode of mutation.addedNodes) {
                if (isAllowedTagName(anode)) {
                    update = true
                    break
                }
            }

            // if update already
            // no need to check deleted nodes, just trigger cache update
            if (update)
                break

            for (const rnode of mutation.removedNodes) {
                if (isAllowedTagName(rnode)) {
                    update = true
                    break
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

    const observer = new MutationObserver(callback)

    observer.observe(target, defaultsDeep(options ?? {}, DEFAULT_OPTIONS))

    return observer
}
