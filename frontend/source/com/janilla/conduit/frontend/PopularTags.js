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
class PopularTags {

	selector;

	engine;

	tags;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'PopularTags');
		}

		if (engine.isRenderingArrayItem('tags'))
			return await engine.render(engine.target, 'PopularTags-tag');
	}

	listen = () => {
		const e = this.selector();
		if (!e)
			return;
		addEventListener('pageload', this.handlePageLoad);
		addEventListener('pageunload', this.handlePageUnload);
		this.selector().addEventListener('click', this.handleClick);
	}

	handlePageLoad = async () => {
		await this.fetchTags();
		const h = await this.engine.render(this, `PopularTags-${this.tags.length ? 'nonempty' : 'empty'}`);
		const e = this.selector();
		if (e)
			e.lastElementChild.outerHTML = h;
		this.listen();
	}

	handlePageUnload = () => {
		removeEventListener('pageload', this.handlePageLoad);
	}

	handleClick = async e => {
		e.preventDefault();
		const a = e.target.closest('.tag-default');
		if (!a)
			return;
		this.selector().dispatchEvent(new CustomEvent('tagselect', {
			bubbles: true,
			detail: { tag: a.textContent }
		}));
	}

	fetchTags = async () => {
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/tags`, { headers: a.headers });
		this.tags = (await s.json()).tags;
	}
}

export default PopularTags;
