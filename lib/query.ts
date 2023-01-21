export function query(selector, context = document) {
    // Redirect simple selectors to the more performant function
    if (/^(#?[\w-]+|\.[\w-.]+)$/.test(selector)) {
        const classes = selector.substr(1).replace(/\./g, ' ')
        switch (selector.charAt(0)) {
            case '#':
                // Handle ID-based selectors
                return [ context.getElementById(selector.substr(1)) ]
            case '.':
                // Handle class-based selectors
                // Query by multiple classes by converting the selector
                // string into single spaced class names
                return [].slice.call(context.getElementsByClassName(classes))
            default:
                // Handle tag-based selectors
                return [].slice.call(context.getElementsByTagName(selector))
        }
    }
    // Default to `querySelectorAll`
    return [].slice.call(context.querySelectorAll(selector))
}
