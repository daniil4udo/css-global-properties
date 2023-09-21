[css-global-properties](../README.md) / [Exports](../modules.md) / CSSGlobalPropertiesOptions

# Interface: CSSGlobalPropertiesOptions

Interface for Options

## Table of contents

### Properties

- [autoprefix](CSSGlobalPropertiesOptions.md#autoprefix)
- [filter](CSSGlobalPropertiesOptions.md#filter)
- [id](CSSGlobalPropertiesOptions.md#id)
- [idAttrTag](CSSGlobalPropertiesOptions.md#idattrtag)
- [ignoreAttrTag](CSSGlobalPropertiesOptions.md#ignoreattrtag)
- [logger](CSSGlobalPropertiesOptions.md#logger)
- [mutationObserveOptions](CSSGlobalPropertiesOptions.md#mutationobserveoptions)
- [normalize](CSSGlobalPropertiesOptions.md#normalize)
- [selector](CSSGlobalPropertiesOptions.md#selector)
- [silent](CSSGlobalPropertiesOptions.md#silent)

## Properties

### autoprefix

• `Optional` **autoprefix**: `boolean`

**`Default`**

```ts
true
```

#### Defined in

[types.ts:31](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L31)

___

### filter

• `Optional` **filter**: `string`

#### Defined in

[types.ts:28](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L28)

___

### id

• `Optional` **id**: `number`

#### Defined in

[types.ts:27](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L27)

___

### idAttrTag

• `Optional` **idAttrTag**: `string`

ID Attribute tag.

**`Default`**

```ts
'css-global-vars-id'
```

#### Defined in

[types.ts:59](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L59)

___

### ignoreAttrTag

• `Optional` **ignoreAttrTag**: `string`

Attribute to ignore.

**`Default`**

```ts
'css-global-vars-ignore'
```

#### Defined in

[types.ts:53](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L53)

___

### logger

• `Optional` **logger**: `Pick`<`Console`, ``"info"`` \| ``"debug"`` \| ``"error"`` \| ``"warn"``\>

**`Default`**

```ts
console
```

#### Defined in

[types.ts:44](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L44)

___

### mutationObserveOptions

• `Optional` **mutationObserveOptions**: `MutationObserverInit`

MutationObserver options

#### Defined in

[types.ts:41](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L41)

___

### normalize

• `Optional` **normalize**: (`name`: `string`) => `string`

#### Type declaration

▸ (`name`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

##### Returns

`string`

**`Default`**

```ts
null
```

#### Defined in

[types.ts:36](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L36)

___

### selector

• `Optional` **selector**: `string`

CSS Selector.

**`Default`**

```ts
':root'
```

#### Defined in

[types.ts:65](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L65)

___

### silent

• `Optional` **silent**: `boolean`

**`Default`**

```ts
true
```

#### Defined in

[types.ts:47](https://github.com/daniil4udo/css-global-properties/blob/19c24c7/lib/types.ts#L47)
