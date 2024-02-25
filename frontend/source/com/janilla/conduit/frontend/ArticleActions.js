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
import FollowButton from './FollowButton.js';

class ArticleActions {

	selector;

	article;

	engine;

	meta;

	followButton;

	favoriteButton;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'ArticleActions');
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
				return await engine.render(this, 'ArticleActions-canModify');
			} else {
				this.meta.content = {
					listen: () => {
						this.followButton.listen();
						this.favoriteButton.listen();
					}
				};
				return await engine.render(this, 'ArticleActions-cannotModify');
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

export default ArticleActions;
