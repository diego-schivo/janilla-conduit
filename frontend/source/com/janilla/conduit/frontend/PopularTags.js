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

	conduit;

	rendering;

	tags;

	render = async (key, rendering) => {
		switch (key) {
			case undefined:
				this.conduit = rendering.stack[0].object;
				this.rendering = rendering.clone();
				return await rendering.render(this, 'PopularTags');
		}

		const n = {
			'tags': 'PopularTags-tag'
		}[rendering.stack.at(-2).key];
		if (n)
			return await rendering.render(rendering.object[key], n);
	}

	listen = () => {
		if (!this.tags)
			this.fetchTags().then(() => {
				return this.rendering.render(this, `PopularTags-${this.tags.length ? 'nonempty' : 'empty'}`);
			}).then(h => {
				this.selector().lastElementChild.outerHTML = h;
				this.listen();
			});
		this.selector().addEventListener('click', this.handleClick);
	}

	fetchTags = async () => {
		return fetch(`${this.conduit.backendUrl}/api/tags`, {
			headers: this.conduit.backendHeaders
		}).then(s => s.json()).then(j => {
			this.tags = j.tags;
		});
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
}

export default PopularTags;
