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
import Pagination from './Pagination.js';

class ArticleList {

	selector;

	conduit;

	rendering;

	articlePreviews;

	pagination;

	render = async (key, rendering) => {
		if (key === undefined) {
			this.conduit = rendering.stack[0].object;
			this.rendering = rendering.clone();
			return await rendering.render(this, 'ArticleList');
		}
	}

	refresh = async () => {
		delete this.articlePreviews;
		delete this.pagination;
		const h = await this.rendering.render(this);
		this.selector().outerHTML = h;
		this.listen();
	}

	listen = () => {
		if (!this.articlePreviews)
			this.fetchArticles().then(c => {
				if (c > 10) {
					this.pagination = new Pagination();
					this.pagination.selector = () => this.selector().lastElementChild;
					this.pagination.pagesCount = Math.ceil(c / 10);
					this.pagination.pageNumber = 1;
				} else
					this.pagination = null;
				return this.rendering.render(this, `ArticleList-${c ? 'nonempty' : 'empty'}`);
			}).then(h => {
				this.selector().innerHTML = h;
				this.listen();
			});
		this.selector().addEventListener('pageselect', this.handlePageSelect);
		this.articlePreviews?.forEach(p => p.listen());
		this.pagination?.listen();
	}

	fetchArticles = async () => {
		const u = new URL(`${this.conduit.backendUrl}/api/articles`);
		u.searchParams.set('skip', ((this.pagination?.pageNumber ?? 1) - 1) * 10);
		u.searchParams.set('limit', 10);
		this.selector().dispatchEvent(new CustomEvent('articlesfetch', {
			bubbles: true,
			detail: { url: u }
		}));
		return fetch(u, {
			headers: this.conduit.backendHeaders
		}).then(s => s.json()).then(j => {
			this.articlePreviews = j.articles.map((a, i) => {
				const q = new ArticlePreview();
				q.selector = () => this.selector().children[i];
				q.article = a;
				return q;
			});
			return j.articlesCount;
		});
	}

	handlePageSelect = async () => {
		this.fetchArticles().then(() => this.rendering.render(this.articlePreviews)).then(h => {
			const e = this.selector();
			e.querySelectorAll('.article-preview').forEach(p => p.remove());
			e.insertAdjacentHTML('afterbegin', h);
			this.listen();
		});
	}
}

export default ArticleList;
