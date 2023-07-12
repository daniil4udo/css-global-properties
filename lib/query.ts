/**
 * A function to query DOM elements based on the provided selector.
 * It handles id, class, and tag name selectors.
 * For complex selectors, it defaults to `querySelectorAll`.
 *
 * @param selector - A string that contains a selector(s) that can be used to identify the elements.
 * @param context - An optional context for the query, defaults to the whole document.
 * @returns An array of elements that match the selector within the provided context.
 */
export function query(selector: string, context: Document | HTMLElement = document): Element[] {
    // Redirect simple selectors to the more performant function
    if (/^(#?[\w-]+|\.[\w-.]+)$/.test(selector)) {
        const classes = selector.slice(1).replace(/\./g, ' ');
        switch (selector.charAt(0)) {
            case '#':
                // Handle ID-based selectors
                // Check if the context is a Document because only Document has getElementById
                if (context instanceof Document)
                    return [ context.getElementById(selector.slice(1)) ].filter(Boolean);

                break;
            case '.':
                // Handle class-based selectors
                // Query by multiple classes by converting the selector
                // string into single spaced class names
                return Array.from(context.getElementsByClassName(classes));
            default:
                // Handle tag-based selectors
                return Array.from(context.getElementsByTagName(selector));
        }
    }
    // Default to `querySelectorAll`
    return Array.from(context.querySelectorAll(selector));
}
