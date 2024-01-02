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
class TagsInput {

	conduit;

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		if (key === undefined)
			return await r.render(this, t['TagsInput']);

		if (r.stack.at(-2).key === 'tagList')
			return await r.render(r.object[key], t['TagsInput-item']);
	}

	listen = () => {
		const d = document.querySelector('.tag-list');
		d.previousElementSibling.addEventListener('keydown', this.handleInputKeyDown);
		d.addEventListener('click', this.handleCloseClick);
	}

	handleCloseClick = e => {
		const i = e.target.closest('.ion-close-round');
		if (!i)
			return;
		e.preventDefault();
		i.parentElement.remove();
	}

	handleInputKeyDown = async e => {
		if (e.code !== 'Enter')
			return;
		e.preventDefault();
		const i = e.currentTarget;
		const d = i.nextElementSibling;
		if (!d.querySelector(`[value="${i.value}"]`)) {
			const h = await this.conduit.rendering.render(i.value, this.conduit.templates['TagsInput-item']);
			d.insertAdjacentHTML('beforeend', h);
		}
		i.value = '';
	}
}

export default TagsInput;
