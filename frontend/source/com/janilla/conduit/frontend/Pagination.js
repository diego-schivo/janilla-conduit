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
class Pagination {

	selector;

	pagesCount;

	pageNumber;

	get items() {
		const i = Array.from({ length: this.pagesCount }, (x, j) => ({ number: 1 + j }));
		i[this.pageNumber - 1].active = 'active';
		return i;
	}

	render = async engine => {
		if (engine.isRendering(this))
			return this.pagesCount > 1 ? await engine.render(this, 'Pagination') : null;

		if (engine.isRendering(this, 'items', true))
			return await engine.render(engine.target, 'Pagination-item');
	}

	listen = () => {
		this.selector().addEventListener('click', this.handleClick);
	}

	handleClick = async e => {
		e.preventDefault();
		const i = e.target.closest('.page-item');
		if (!i || i.classList.contains('active'))
			return;
		this.pageNumber = parseInt(i.textContent);
		const p = i.closest('.pagination');
		p.querySelectorAll('.page-item').forEach(j => j.classList[j === i ? 'add' : 'remove']('active'));
		p.dispatchEvent(new CustomEvent('pageselect', {
			bubbles: true,
			detail: { pageNumber: this.pageNumber }
		}));
	}
}

export default Pagination;
