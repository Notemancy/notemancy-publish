// carta-instance.ts
	import { Carta, Markdown, MarkdownEditor, type Plugin } from 'carta-md';
import min_light from 'shiki/themes/min-light.mjs';
import min_dark from 'shiki/themes/min-dark.mjs';
	import rehypeKatex from 'rehype-katex';
	  import "katex/dist/katex.css";


import cartawiki from './cartawiki';
import { math } from '@cartamd/plugin-math';
import { anchor } from '@cartamd/plugin-anchor';
import { code } from '@cartamd/plugin-code';
import DOMPurify from 'isomorphic-dompurify';
import rehypeCallouts from 'rehype-callouts';
import rehypeMermaid from 'rehype-mermaid';

let cachedCarta: Carta | null = null;

const mermaid: Plugin = {
		transformers: [
			{
				execution: 'async',
				type: 'rehype',
				transform({ processor }) {
					processor.use(rehypeMermaid, { strategy: 'img-png' });
				}
			}
		]
	};
	const callouts: Plugin = {
		transformers: [
			{
				execution: 'async',
				type: 'rehype',
				transform({ processor }) {
					processor.use(rehypeCallouts);
				}
			}
		]
	};

	export function getCartaInstance(theme: 'dark' | 'light') {
  if (!cachedCarta) {
    cachedCarta = new Carta({
      theme: theme === 'dark' ? min_dark : min_light,
      shikiOptions: { themes: [min_light, min_dark] },
      extensions: [
        cartawiki,
        math(),
        callouts,
        mermaid,
        anchor(),
        code({
          langs: ['javascript', 'docker', 'py', 'markdown', 'yaml', 'toml', 'bash']
        })
      ],
      sanitizer: DOMPurify.sanitize
    });
  }
  return cachedCarta;
}

