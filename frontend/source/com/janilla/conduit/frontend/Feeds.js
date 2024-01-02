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
import ArticlePreview from './ArticlePreview.js';

class Feeds {

	conduit;

	modifyParameters;

	pageNumber = 1;

	toggleClass;

	get pageItems() {
		const i = Array.from({ length: this.pagesCount }, (x, j) => ({ number: 1 + j }));
		if (this.pageNumber <= i.length)
			i[this.pageNumber - 1].active = 'active';
		return i;
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		switch (key) {
			case undefined:
				this.renderStack = [...r.stack];
				return await r.render(this, t['Feeds']);

			case 'articles':
				const p = new URLSearchParams({ skip: (this.pageNumber - 1) * 10, limit: 10 });
				this.modifyParameters(p);
				const s = await fetch(`${this.conduit.backendUrl}/api/articles?${p}`, {
					headers: this.conduit.backendHeaders
				});
				if (s.ok) {
					const j = await s.json();
					this.articlePreviews = j.articles.map(a => {
						const q = new ArticlePreview();
						q.article = a;
						q.conduit = this.conduit;
						return q;
					});
					this.pagesCount = Math.ceil(j.articlesCount / 10);
				}
				return this.articlePreviews;
		}

		const n = {
			'navItems': 'Feeds-navitem',
			'pageItems': 'Feeds-pageitem'
		}[r.stack.at(-2).key];
		if (n)
			return await r.render(r.object[key], t[n]);
	}

	listen = () => {
		document.querySelector(`.${this.toggleClass} .nav-pills`).addEventListener('click', this.handleNavClick);
		document.querySelector('.pagination').addEventListener('click', this.handlePageClick);
		this.articlePreviews.forEach(p => p.listen());
	}

	handleNavClick = async e => {
		e.preventDefault();
		const a = e.target.closest('.nav-link');
		if (!a || a.classList.contains('active'))
			return;
		document.querySelector(`.${this.toggleClass}`).dispatchEvent(new CustomEvent('feedselect', {
			bubbles: true,
			detail: { navLink: a }
		}));
		this.refresh();
	}

	handlePageClick = async e => {
		e.preventDefault();
		const a = e.target.closest('.page-item');
		if (!a)
			return;
		this.pageNumber = parseInt(a.textContent);
		this.refresh();
	}

	refresh = async () => {
		const r = this.conduit.rendering;
		const h = await r.render(this, null, this.renderStack);
		document.querySelector(`.${this.toggleClass}`).parentElement.innerHTML = h;
		this.listen();
	}
}

export default Feeds;
