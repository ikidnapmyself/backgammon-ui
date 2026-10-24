import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Board, startBoard } from '../index';

describe('Board', () => {
    it('draws fifteen checkers for each seat at the start', () => {
        const html = renderToString(<Board board={startBoard()} viewer={0} />);
        expect(html.match(/checker--0/g)).toHaveLength(15);
        expect(html.match(/checker--1/g)).toHaveLength(15);
    });
});
