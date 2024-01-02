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
class ArticlePreview {

	article;

	conduit;

	get favoriteName() {
		return this.article.favorited ? 'unfavorite' : 'favorite';
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		if (key === undefined) {
			this.renderStack = [...r.stack];
			return await r.render(this, t['ArticlePreview']);
		}

		if (typeof key === 'string' && Object.hasOwn(this.article, key)) {
			let v = this.article[key];
			switch (key) {
				/*
				case 'createdAt':
					return new Date(v).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					});
				*/

				case 'favorited':
					return v ? 'btn-primary' : 'btn-outline-primary';

				default:
					return v;
			}
		}

		if (r.stack.length >= 2 && r.stack.at(-2).key === 'tagList')
			return await r.render(r.stack.at(-1).object[key], t['Article-tag']);
	}

	listen = () => {
		document.getElementById(`article-${this.article.slug}`).addEventListener('click', this.handleClick);
	}

	handleClick = async e => {
		const b = e.target.closest('button');
		if (!b)
			return;
		e.preventDefault();

		switch (b.name) {
			case 'favorite':
			case 'unfavorite':
				const a = b.closest('.article-preview');
				const h = a.querySelector('.preview-link').getAttribute('href');
				const s = await fetch(`${this.conduit.backendUrl}/api/articles/${h.split('/')[2]}/favorite`, {
					method: b.name === 'favorite' ? 'POST' : 'DELETE',
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					this.article = (await s.json()).article;
				const r = this.conduit.rendering;
				a.outerHTML = await r.render(this, null, this.renderStack);
				this.listen();
				break;
		}
	}
}

export default ArticlePreview;
