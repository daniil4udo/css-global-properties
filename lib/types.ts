export type CSSPixelValue = '0' | `${string}px`

export type CSSLengthValue = '0' | string | '%'
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

export type CSSAngleValue = string | 'deg' | 'grad' | 'rad' | 'turn'

export type CSSHexColor = `#${string}`

/**
 * Interface for Options
 */
export interface CSSGlobalPropertiesOptions {
    id?: number
    filter?: string

    /** @default true */
    autoprefix?: boolean

    /**
     * @default null
     */
    normalize?: (name: string) => string

    /**
     * MutationObserver options
     */
    mutationObserveOptions?: MutationObserverInit

    /** @default console */
    Logger?: Pick<Console, 'info' | 'debug' | 'error' | 'warn'>

    /** @default true */
    silent?: boolean

    /**
     * Attribute to ignore.
     * @default 'css-global-vars-ignore'
     */
    ignoreAttrTag?: string

    /**
     * ID Attribute tag.
     * @default 'css-global-vars-id'
     */
    idAttrTag?: string

    /**
     * CSS Selector.
     * @default ':root'
     */
    selector?: string
}
export interface InitObserver {
    target?: Node
    options?: MutationObserverInit
    onUpdate?: () => void
}
