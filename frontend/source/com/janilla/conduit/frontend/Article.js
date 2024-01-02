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
import CommentCard from './CommentCard.js';
import CommentForm from './CommentForm.js';
import convertMarkdownIntoHTML from './markdown.js';

class Article {

	article;

	commentCards;

	commentForm;

	conduit;

	renderStack;

	title = 'Article';

	get buttons() {
		const f = this.article.author.following;
		const g = this.article.favorited;
		if (this.article.author.username === this.conduit.user?.username)
			return [{
				class: 'btn-outline-secondary',
				name: 'edit',
				icon: 'ion-edit',
				text: 'Edit Article'
			}, {
				class: 'btn-outline-danger',
				name: 'delete',
				icon: 'ion-trash-a',
				text: 'Delete Article'
			}];
		else
			return [{
				class: f ? 'btn-secondary' : 'btn-outline-secondary',
				name: f ? 'unfollow' : 'follow',
				icon: 'ion-plus-round',
				text: `${f ? 'Unfollow' : 'Follow'} ${this.article.author.username}`
			}, {
				class: g ? 'btn-primary' : 'btn-outline-primary',
				name: g ? 'unfavorite' : 'favorite', icon: 'ion-heart',
				text: `${g ? 'Unfavorite' : 'Favorite'} Article <span class="counter">(${this.article.favoritesCount})</span>`
			}];
	}

	get slug() {
		return location.hash.split('/')[2];
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		let s;
		switch (key) {
			case undefined:
				this.renderStack = [...r.stack];
				s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.slug}`, {
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					this.article = (await s.json()).article;
				return await r.render(this, t['Article']);

			case 'commentForm':
				this.commentForm = new CommentForm();
				this.commentForm.article = this.article;
				this.commentForm.conduit = this.conduit;
				return this.commentForm;

			case 'comments':
				s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}/comments`, {
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					this.commentCards = (await s.json()).comments.map(c => {
						const d = new CommentCard();
						d.article = this.article;
						d.comment = c;
						d.conduit = this.conduit;
						return d;
					});
				return this.commentCards;

			case 'meta':
				return await r.render(null, t['Article-meta']);
		}

		if (typeof key === 'string' && Object.hasOwn(this.article, key)) {
			let v = this.article[key];
			switch (key) {
				case 'body':
					v = convertMarkdownIntoHTML(v);
					break;
			}
			return v;
		}

		const n = r.stack.length >= 2 && {
			'buttons': 'Article-button',
			'tagList': 'Article-tag'
		}[r.stack.at(-2).key];
		if (n)
			return await r.render(r.stack.at(-1).object[key], t[n]);
	}

	listen = () => {
		const p = document.querySelector('.article-page');
		p.addEventListener('commentadd', this.handleCommentAdd);
		p.addEventListener('commentremove', this.handleCommentRemove);
		document.querySelectorAll('.article-meta').forEach(m => m.addEventListener('click', this.handleMetaClick));
		this.commentForm.listen();
		this.commentCards.forEach(c => c.listen());
	}

	handleCommentAdd = async e => {
		const c = new CommentCard();
		c.article = this.article;
		c.comment = e.detail.comment;
		c.conduit = this.conduit;
		this.commentCards.unshift(c);

		const r = this.conduit.rendering;
		const h = await r.render(c, null, this.renderStack);
		document.querySelector('.comment-form').insertAdjacentHTML('afterend', h);
		c.listen();
	}

	handleCommentRemove = e => {
		const i = this.commentCards.findIndex(c => c.comment.id === e.detail.comment.id);
		this.commentCards.splice(i, 1);
	}

	handleMetaClick = async e => {
		const b = e.target.closest('button');
		if (!b)
			return;
		e.preventDefault();

		const r = this.conduit.rendering;
		const t = this.conduit.templates;
		let s, h;
		switch (b.name) {
			case 'delete':
				s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}`, {
					method: 'DELETE',
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					location.hash = '#/';
				break;

			case 'edit':
				location.hash = `#/editor/${this.article.slug}`;
				break;

			case 'follow':
			case 'unfollow':
				if (this.conduit.user) {
					s = await fetch(`${this.conduit.backendUrl}/api/profiles/${this.article.author.username}/follow`, {
						method: b.name === 'follow' ? 'POST' : 'DELETE',
						headers: this.conduit.backendHeaders
					});
					if (s.ok)
						this.article.author.following = (await s.json()).profile.following;
					h = await r.render(this, t['Article-meta'], this.renderStack);
					document.querySelectorAll('.article-meta').forEach(m => m.outerHTML = h);
					this.listen();
				} else
					location.hash = '#/login';
				break;

			case 'favorite':
			case 'unfavorite':
				if (this.conduit.user) {
					s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}/favorite`, {
						method: b.name === 'favorite' ? 'POST' : 'DELETE',
						headers: this.conduit.backendHeaders
					});
					if (s.ok)
						this.article = (await s.json()).article;
					h = await r.render(this, t['article-meta'], this.renderStack);
					document.querySelectorAll('.article-meta').forEach(m => m.outerHTML = h);
					this.listen();
				} else
					location.hash = '#/login';
				break;
		}
	}
}

export default Article;
