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
import ArticleActions from './ArticleActions.js';
import Comments from './Comments.js';
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
			this.actions1 = new ArticleActions();
			this.actions1.article = this.article;
			this.actions1.selector = () => this.selector().querySelector('h1').nextElementSibling;
			return this.actions1;
		}

		if (engine.isRendering(this.article, 'body'))
			return formatMarkdownAsHTML(parseMarkdown(this.article.body));

		if (engine.isRendering(this, 'actions2')) {
			this.actions2 = new ArticleActions();
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

export default Article;
