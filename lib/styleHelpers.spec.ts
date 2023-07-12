import { beforeEach, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { addCSSRule, createRootStyle } from './styleHelpers'; // Import your function

describe('createRootStyle', () => {
    beforeEach(() => {
        // Clean up document head before each test
        document.head.innerHTML = '';
    });

    it('should create a style tag with default values', () => {
        const style = createRootStyle();
        expect(style).toBeDefined();
        expect(style.media).toBe('all');
        expect(document.head.contains(style)).toBeTruthy();
    });

    it('should create a style tag with given media', () => {
        const media = 'print';
        const style = createRootStyle({ media });
        expect(style.media).toBe(media);
        expect(document.head.contains(style)).toBeTruthy();
    });

    it('should create a style tag with given id', () => {
        const id = 'myStyle';
        const style = createRootStyle({ id });
        expect(style.id).toBe(id);
        expect(document.head.contains(style)).toBeTruthy();
    });

    it('should generate different IDs for different style tags', () => {
        const style1 = createRootStyle();
        const style2 = createRootStyle();
        expect(style1.id).not.toBe(style2.id);
    });

    it('should create a style tag with empty string as id if given id is empty string', () => {
        const style = createRootStyle({ id: '' });
        expect(style.id).toBe('');
    });

    it('should not override existing elements with same id', () => {
        const id = 'myStyle';
        const oldStyle = document.createElement('style');
        oldStyle.id = id;
        document.head.appendChild(oldStyle);
        const newStyle = createRootStyle({ id });
        expect(newStyle.id).toBe(id);
        expect(document.head.querySelectorAll(`#${id}`).length).toBe(2);
    });

    it('should not add text node to style tag if textContent is not empty', () => {
        const style = document.createElement('style');
        style.textContent = 'body { background-color: blue; }';
        document.head.appendChild(style);
        expect(style.childNodes.length).toBe(1);
    });
});
