/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
class Tabs {

	selector;

	engine;

	items;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'Tabs');
		}

		if (engine.isRendering(this, 'items', true))
			return await engine.render(engine.target, 'Tabs-item');
	}

	refresh = async () => {
		const h = await this.render(this.engine);
		const e = this.selector();
		if (e)
			e.outerHTML = h;
		this.listen();
	}

	listen = () => {
		this.selector()?.addEventListener('click', this.handleClick);
	}

	handleClick = async e => {
		e.preventDefault();
		const l = e.target.closest('.nav-link');
		if (!l || l.classList.contains('active'))
			return;
		const n = l.closest('.nav');
		n.querySelectorAll('.nav-link').forEach(m => m.classList[m === l ? 'add' : 'remove']('active'));
		n.dispatchEvent(new CustomEvent('tabselect', {
			bubbles: true,
			detail: { tab: l.getAttribute('href').substring(1) }
		}));
	}
}

export default Tabs;
