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

	selector;
	
	rendering;

	render = async (key, rendering) => {
		if (key === undefined) {
			this.rendering = rendering.clone();
			return await rendering.render(this, 'TagsInput');
		}

		if (rendering.stack.at(-2).key === 'tagList')
			return await rendering.render(rendering.object[key], 'TagsInput-tag');
	}

	listen = () => {
		const i = this.selector().firstElementChild;
		i.addEventListener('keydown', this.handleInputKeyDown);
		i.nextElementSibling.addEventListener('click', this.handleCloseClick);
	}

	handleCloseClick = e => {
		const i = e.target.closest('.ion-close-round');
		if (!i)
			return;
		e.preventDefault();
		i.closest('.tag-default').remove();
	}

	handleInputKeyDown = async e => {
		if (e.key !== 'Enter')
			return;
		e.preventDefault();
		const i = e.currentTarget;
		const d = i.nextElementSibling;
		if (!d.querySelector(`[value="${i.value}"]`)) {
			const h = await this.rendering.render(i.value, 'TagsInput-tag');
			d.insertAdjacentHTML('beforeend', h);
		}
		i.value = '';
	}
}

export default TagsInput;
