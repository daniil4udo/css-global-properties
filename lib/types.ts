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

export interface IOptions {
    id?: number;
    filter?: string;
    autoprefix?: boolean;
    normalize?: (name: string) => string;
    mutationObserveOptions?: MutationObserverInit;

    Logger?: Pick<Console, 'info' | 'debug' | 'error' | 'warn'>;

    ignoreAttrTag?: string;
    idAttrTag?: string;

    selector?: string;
}

export interface InitObserver {
    target?: Node;
    options?: MutationObserverInit;
    onUpdate?: () => void;
}
