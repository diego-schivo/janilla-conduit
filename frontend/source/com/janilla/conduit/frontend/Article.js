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
import Errors from './Errors.js';
import FavoriteButton from './FavoriteButton.js';
import FollowButton from './FollowButton.js';
import { parseMarkdown, formatMarkdownAsHTML } from './markdown.js';

class Article {

	selector;

	title = 'Article';

	article;

	actions1;

	actions2;

	comments;

	get slug() {
		return location.hash.split('/')[2];
	}

	render = async engine => {
		let s;
		if (engine.isRendering(this)) {
			const a = engine.app.api;
			s = await fetch(`${a.url}/articles/${this.slug}`, {
				headers: a.headers
			});
			if (s.ok)
				this.article = (await s.json()).article;
			return await engine.render(this, 'Article');
		}

		if (engine.isRendering(this, 'actions1')) {
			this.actions1 = new Actions();
			this.actions1.article = this.article;
			this.actions1.selector = () => this.selector().querySelector('h1').nextElementSibling;
			return this.actions1;
		}

		if (engine.isRendering(this.article, 'body'))
			return formatMarkdownAsHTML(parseMarkdown(this.article.body));

		if (engine.isRendering(this, 'actions2')) {
			this.actions2 = new Actions();
			this.actions2.article = this.article;
			this.actions2.selector = () => this.selector().querySelector('.article-actions').firstElementChild;
			return this.actions2;
		}

		if (engine.isRendering(this, 'comments')) {
			this.comments = new Comments();
			this.comments.article = this.article;
			this.comments.selector = () => this.selector().querySelector('.article-actions').nextElementSibling;
			return this.comments;
		}

		if (engine.isRendering(this, 'tagList', true))
			return await engine.render(engine.target, 'Article-tag');
	}

	listen = () => {
		const e = this.selector();
		e.addEventListener('followtoggle', this.handleFollowToggle);
		e.addEventListener('favoritetoggle', this.handleFavoriteToggle);
		this.actions1.listen();
		this.actions2.listen();
		this.comments.listen();
	}

	handleFollowToggle = async e => {
		const a = [this.actions1, this.actions2].find(x => !x.selector().contains(e.target));
		await a.refresh();
	}

	handleFavoriteToggle = async e => {
		const a = [this.actions1, this.actions2].find(x => !x.selector().contains(e.target));
		await a.refresh();
	}
}

class Actions {

	selector;

	article;

	engine;

	meta;

	followButton;

	favoriteButton;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'Article-Actions');
		}

		if (engine.isRendering(this, 'meta')) {
			this.meta = new ArticleMeta();
			this.meta.selector = this.selector;
			return this.meta;
		}
		if (engine.isRendering(this.meta, 'content')) {
			if (this.article.author.username === this.engine.app.currentUser?.username) {
				this.meta.content = {
					listen: () => {
						const e = this.meta.content.selector();
						e.querySelector('a').addEventListener('click', this.handleEditClick);
						e.querySelector('button').addEventListener('click', this.handleDeleteClick);
					}
				};
				return await engine.render(this, 'Article-Actions-canModify');
			} else {
				this.meta.content = {
					listen: () => {
						this.followButton.listen();
						this.favoriteButton.listen();
					}
				};
				return await engine.render(this, 'Article-Actions-cannotModify');
			}
		}

		if (engine.isRendering(this, 'followButton')) {
			this.followButton = new FollowButton();
			this.followButton.user = this.article.author;
			this.followButton.selector = () => this.meta.content.selector().firstElementChild;
			return this.followButton;
		}

		if (engine.isRendering(this, 'favoriteButton')) {
			this.favoriteButton = new FavoriteButton();
			this.favoriteButton.article = this.article;
			this.favoriteButton.selector = () => this.meta.content.selector().lastElementChild;
			return this.favoriteButton;
		}
	}

	listen = () => {
		this.meta.listen();
	}

	refresh = async () => {
		delete this.meta;
		delete this.followButton;
		delete this.favoriteButton;
		const h = await this.render(this.engine);
		this.selector().outerHTML = h;
		this.listen();
	}

	handleEditClick = async e => {
		location.hash = `#/editor/${this.article.slug}`;
	}

	handleDeleteClick = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/articles/${this.article.slug}`, {
			method: 'DELETE',
			headers: a.headers
		});
		if (s.ok)
			location.hash = '#/';
	}
}

class Comments {

	selector;

	article;

	engine;

	form;

	cards;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'Article-Comments');
		}

		if (engine.isRendering(this, 'form')) {
			this.form = new CommentForm();
			this.form.article = this.article;
			this.form.selector = () => this.selector().firstElementChild.firstElementChild;
			return this.form;
		}

		if (engine.isRendering(this, 'cards')) {
			const a = engine.app.api;
			const s = await fetch(`${a.url}/articles/${this.article.slug}/comments`, {
				headers: a.headers
			});
			this.cards = s.ok ? (await s.json()).comments.map((c, i) => {
				const d = new CommentCard();
				d.article = this.article;
				d.comment = c;
				d.selector = () => this.selector().firstElementChild.children[1 + i];
				return d;
			}) : null;
			return this.cards;
		}
	}

	listen = () => {
		const e = this.selector();
		e.addEventListener('commentadd', this.handleCommentAdd);
		e.addEventListener('commentremove', this.handleCommentRemove);
		this.form.listen();
		this.cards.forEach(c => c.listen());
	}

	handleCommentAdd = async e => {
		const c = new CommentCard();
		c.article = this.article;
		c.comment = e.detail.comment;
		c.selector = () => this.selector().firstElementChild.children[1];
		this.cards.unshift(c);

		const h = await this.engine.render(c);
		this.form.selector().insertAdjacentHTML('afterend', h);
		c.listen();
	}

	handleCommentRemove = e => {
		const i = this.cards.findIndex(c => c.comment.id === e.detail.comment.id);
		this.cards.splice(i, 1);
	}
}

class CommentCard {

	selector;

	engine;

	article;

	comment;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'Article-Comments-Card');
		}

		if (engine.isRendering(this, 'modOptions'))
			return engine.app.currentUser?.username === this.comment.author.username ? await engine.render(this, 'Article-Comments-Card-modOptions') : '';
	}

	listen = () => {
		this.selector().querySelector('.ion-trash-a')?.addEventListener('click', this.handleDeleteClick);
	}

	handleDeleteClick = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/articles/${this.article.slug}/comments/${this.comment.id}`, {
			method: 'DELETE',
			headers: a.headers
		});
		if (s.ok) {
			const c = this.selector();
			c.dispatchEvent(new CustomEvent('commentremove', {
				bubbles: true,
				detail: { comment: this.comment }
			}));
			c.remove();
		}
	}
}

class CommentForm {

	selector;

	article;

	engine;

	errors;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, `Article-Comments-Form-${this.engine.app.currentUser ? 'authenticated' : 'unauthenticated'}`);
		}

		if (engine.isRendering(this, 'errors')) {
			this.errors = new Errors();
			this.errors.selector = () => this.selector().firstElementChild;
			return this.errors;
		}
	}

	listen = () => {
		this.selector().querySelector('.comment-form')?.addEventListener('submit', this.handleSubmit);
	}

	handleSubmit = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const f = e.currentTarget;
		const s = await fetch(`${a.url}/articles/${this.article.slug}/comments`, {
			method: 'POST',
			headers: { ...a.headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ comment: Object.fromEntries(new FormData(f)) })
		});
		const j = await s.json();
		this.errors.messages = s.ok ? null : j;
		await this.errors.refresh();
		if (s.ok) {
			f.elements['body'].value = '';
			this.selector().dispatchEvent(new CustomEvent('commentadd', {
				bubbles: true,
				detail: { comment: j.comment }
			}));
		}
	}
}

export default Article;
