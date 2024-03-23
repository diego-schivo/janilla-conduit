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
import ArticleMeta from './ArticleMeta.js';
import FavoriteButton from './FavoriteButton.js';

class ArticleList {

	selector;

	engine;

	articlePreviews;

	pagination;

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = this.articlePreviews === undefined ? 'ArticleList' : `ArticleList-${this.articlePreviews.length ? 'nonempty' : 'empty'}`;
		});
	}

	refresh = async () => {
		const e = this.selector();
		if (!e)
			return;
		delete this.articlePreviews;
		delete this.pagination;
		const h = await this.engine.render();
		e.outerHTML = h;
		this.listen();
		this.handlePageLoad();
	}

	listen = () => {
		const e = this.selector();
		if (!e)
			return;
		addEventListener('pageload', this.handlePageLoad);
		addEventListener('pageunload', this.handlePageUnload);
		e.addEventListener('pageselect', this.handlePageSelect);
		this.articlePreviews?.forEach(x => x.listen());
		this.pagination?.listen();
	}

	handlePageLoad = async () => {
		const c = await this.fetchArticles();
		if (c > 10) {
			this.pagination = new Pagination();
			this.pagination.selector = () => this.selector().lastElementChild;
			this.pagination.pagesCount = Math.ceil(c / 10);
			this.pagination.pageNumber = 1;
		} else
			this.pagination = null;
		const h = await this.engine.render();
		const e = this.selector();
		if (e)
			e.innerHTML = h;
		this.listen();
	}

	handlePageUnload = () => {
		removeEventListener('pageload', this.handlePageLoad);
	}

	handlePageSelect = async () => {
		await this.fetchArticles();
		const h = await this.engine.render({ value: this.articlePreviews });
		const e = this.selector();
		e.querySelectorAll('.article-preview').forEach(p => p.remove());
		e.insertAdjacentHTML('afterbegin', h);
		this.listen();
	}

	fetchArticles = async () => {
		const a = this.engine.app.api;
		const u = new URL(`${a.url}/articles`);
		u.searchParams.set('skip', ((this.pagination?.pageNumber ?? 1) - 1) * 10);
		u.searchParams.set('limit', 10);
		this.selector().dispatchEvent(new CustomEvent('articlesfetch', {
			bubbles: true,
			detail: { url: u }
		}));
		const s = await fetch(u, { headers: a.headers });
		const j = await s.json();
		this.articlePreviews = j.articles.map((a, i) => {
			const p = new Preview();
			p.selector = () => this.selector().children[i];
			p.article = a;
			return p;
		});
		return j.articlesCount;
	}
}

class Preview {

	selector;

	article;

	meta;

	favoriteButton;

	render = async e => {
		return await e.match([this], (i, o) => {
			o.template = 'ArticleList-Preview';
		}) || await e.match([this, 'meta'], (i, o) => {
			this.meta = new ArticleMeta();
			this.meta.selector = () => this.selector().firstElementChild;
			o.value = this.meta;
		}) || await e.match([this.meta, 'content'], (i, o) => {
			this.favoriteButton = new FavoriteButton();
			this.favoriteButton.article = this.article;
			this.meta.content = this.favoriteButton;
			o.value = this.favoriteButton;
		}) || await e.match([this.favoriteButton, 'content'], (i, o) => {
			o.value = this.article.favoritesCount;
		}) || await e.match([this.favoriteButton, 'className'], (i, o) => {
			o.value = `${this.article.favorited ? 'btn-primary' : 'btn-outline-primary'} pull-xs-right`;
		}) || await e.match([this.article, 'tagList', 'number'], (i, o) => {
			o.template = 'ArticleList-Preview-tag';
		});
	}

	listen = () => {
		this.meta?.listen();
	}
}

class Pagination {

	selector;

	pagesCount;

	pageNumber;

	get items() {
		const i = Array.from({ length: this.pagesCount }, (x, j) => ({ number: 1 + j }));
		i[this.pageNumber - 1].active = 'active';
		return i;
	}

	render = async e => {
		return await e.match([this], (i, o) => {
			if (this.pagesCount > 1)
				o.template = 'ArticleList-Pagination';
		}) || await e.match([this, 'items', 'number'], (i, o) => {
			o.template = 'ArticleList-Pagination-item';
		});
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

export default ArticleList;
